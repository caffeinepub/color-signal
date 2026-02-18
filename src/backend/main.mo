import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  type HistoryItem = {
    result : Text;
    timestamp : Int;
  };

  public type BigSmallPrediction = {
    prediction : Text;
    explanation : Text;
  };

  let historyStore = Map.empty<Principal, List.List<HistoryItem>>();

  public shared ({ caller }) func saveHistoryEntry(newEntry : HistoryItem) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save entries");
    };

    let currentHistory = switch (historyStore.get(caller)) {
      case (null) { List.empty<HistoryItem>() };
      case (?history) { history };
    };

    currentHistory.add(newEntry);

    // Cap at 30 entries
    if (currentHistory.size() > 30) {
      _removeFirst(currentHistory);
    };

    historyStore.add(caller, currentHistory);
  };

  public query ({ caller }) func getHistory() : async [HistoryItem] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view history");
    };

    switch (historyStore.get(caller)) {
      case (null) { [] };
      case (?history) { history.toArray() };
    };
  };

  public query func predictNext(history : [HistoryItem]) : async BigSmallPrediction {
    if (history.size() == 0) {
      return {
        prediction = "Big";
        explanation = "No history data available yet. Default prediction is 'Big'.";
      };
    };

    let bigCount = countResults(history, "Big");
    let smallCount = countResults(history, "Small");
    let longestStreak = calculateLongestStreak(history);
    let shortTermTrend = checkShortTermTrend(history, 5);

    // Short-Term Trend Analysis
    if (shortTermTrend.0 and shortTermTrend.1 > 2) {
      return {
        prediction = "Small";
        explanation = "There is a strong short-term trend of 'Big' results. Expecting a potential reversal to 'Small' based on the gambler's fallacy.";
      };
    };

    if (not shortTermTrend.0 and shortTermTrend.1 > 2) {
      return {
        prediction = "Big";
        explanation = "There is a strong short-term trend of 'Small' results. Expecting a potential reversal to 'Big' based on the gambler's fallacy.";
      };
    };

    // Long-Term Bias Analysis
    if (bigCount > smallCount) {
      return {
        prediction = "Small";
        explanation = "Long-term history shows a bias towards 'Big' results. Predicting 'Small' assuming trend reversals are likely.";
      };
    } else if (smallCount > bigCount) {
      return {
        prediction = "Big";
        explanation = "Long-term history shows a bias towards 'Small' results. Predicting 'Big' assuming trend reversals are likely.";
      };
    };

    // Streak Analysis
    if (longestStreak > 3 and history.size() > 0) {
      let lastResult = history[history.size() - 1].result;
      let nextPrediction = if (Text.equal(lastResult, "Big")) {
        "Small";
      } else {
        "Big";
      };
      return {
        prediction = nextPrediction;
        explanation = "Extended streak detected. Predicting a reversal from the streak's dominant result.";
      };
    };

    // Random Fluctuation Handling
    let randomTrend = checkShortTermTrend(history, 3);
    if (randomTrend.1 == 1) {
      return {
        prediction = if (randomTrend.0) { "Small" } else { "Big" };
        explanation = "Random fluctuations detected recently. No strong trend identified, predicting based on the last result.";
      };
    };

    // Default prediction - fallback to 'Big'
    {
      prediction = "Big";
      explanation = "No dominant trend identified in history data. Predicting 'Big' by default.";
    };
  };

  func _removeFirst<T>(list : List.List<T>) {
    if (list.size() > 0) {
      var iter = list.values();
      ignore iter.next();
      let newList = List.fromIter(iter);
      list.clear();
      for (item in newList.values()) {
        list.add(item);
      };
    };
  };

  func countResults(history : [HistoryItem], target : Text) : Int {
    var count = 0;
    var i = 0;
    while (i < history.size()) {
      if (Text.equal(history[i].result, target)) {
        count += 1;
      };
      i += 1;
    };
    count;
  };

  func calculateLongestStreak(history : [HistoryItem]) : Nat {
    var maxStreak = 0;
    var currentStreak = 1;

    if (history.size() == 0) {
      return 0;
    };

    var lastResult = history[0].result;

    // Fixed: Use range 1 to (size - 1) to avoid out-of-bounds
    if (history.size() > 1) {
      for (i in Nat.range(1, history.size() - 1)) {
        if (Text.equal(history[i].result, lastResult)) {
          currentStreak += 1;
          maxStreak := Int.max(currentStreak, maxStreak).toNat();
        } else {
          currentStreak := 1;
          lastResult := history[i].result;
        };
      };
    };

    maxStreak;
  };

  func checkShortTermTrend(history : [HistoryItem], windowSize : Nat) : (Bool, Nat) {
    let size = history.size();
    if (size == 0 or windowSize == 0) {
      return (true, 0);
    };

    let actualWindow = Nat.min(windowSize, size);
    let startIndex = size - actualWindow;
    let targetResult = history[startIndex].result;

    var isConsistent = true;
    var streakLength = 0;

    var i = 0;
    while (i < actualWindow) {
      if (Text.equal(history[startIndex + i].result, targetResult)) {
        streakLength += 1;
      } else {
        isConsistent := false;
      };
      i += 1;
    };

    (Text.equal(targetResult, "Big") and isConsistent, streakLength);
  };

  public query func getPredictionBias(history : [HistoryItem]) : async Int {
    // No authorization check - operates on provided history data, accessible to all
    let bigCount = countResults(history, "Big");
    let smallCount = countResults(history, "Small");
    bigCount - smallCount;
  };

  public query func getTimeWindowStats(history : [HistoryItem], window : Int, target : Text) : async Int {
    // No authorization check - operates on provided history data, accessible to all
    var count = 0;
    var i = 0;
    let size = history.size();
    let windowSize = Nat.min(Int.abs(window), size);
    while (i < windowSize) {
      if (Text.equal(history[i].result, target)) {
        count += 1;
      };
      i += 1;
    };
    count;
  };
};
