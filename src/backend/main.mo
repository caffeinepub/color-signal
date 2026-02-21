import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Float "mo:core/Float";
import Array "mo:core/Array";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

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
  var accuracyRate : Float = 0.0;
  var numPredictions : Nat = 0;
  var lossStreak : Nat = 0;
  var winStreak : Nat = 0;
  var bigBiasCount : Nat = 0;
  var smallBiasCount : Nat = 0;

  var historicalPatterns : [[Text]] = [];
  var cacheTimeWindow : ?Int = null;

  public shared ({ caller }) func saveHistoryEntry(newEntry : HistoryItem) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save entries");
    };

    let currentHistory = switch (historyStore.get(caller)) {
      case (null) { List.empty<HistoryItem>() };
      case (?history) { history };
    };

    currentHistory.add(newEntry);

    if (currentHistory.size() > 20) {
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

  public shared ({ caller }) func updatePredictionFeedback(feedback : [Bool]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update predictions");
    };

    var correctPredictions = 0;
    for (f in feedback.values()) {
      if (f) { correctPredictions += 1 };
    };

    numPredictions += feedback.size();
    accuracyRate := numPredictions.toFloat() / feedback.size().toFloat();

    // Update streaks
    if (feedback.size() > 0) {
      let lastFeedback = feedback[feedback.size() - 1];
      if (lastFeedback) {
        winStreak += 1;
        lossStreak := 0;
      } else {
        lossStreak += 1;
        winStreak := 0;
      };
    };
  };

  public shared ({ caller }) func analyzeBias(history : [HistoryItem]) : async (Nat, Nat) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can analyze bias");
    };

    var bigCount = 0;
    var smallCount = 0;

    for (item in history.values()) {
      if (Text.equal(item.result, "Big")) {
        bigCount += 1;
      } else if (Text.equal(item.result, "Small")) {
        smallCount += 1;
      };
    };

    bigBiasCount := bigCount;
    smallBiasCount := smallCount;

    (bigCount, smallCount);
  };

  public query ({ caller }) func switchTrendAnalysis(history : [HistoryItem]) : async (Bool, Nat) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform switch trend analysis");
    };

    let (hasSwitch, switchCount) = _checkSwitchTrend(history);

    (hasSwitch, switchCount);
  };

  public shared ({ caller }) func updateTimeWindow(timeWindow : Int) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can set time window");
    };

    cacheTimeWindow := ?timeWindow;
  };

  public shared ({ caller }) func historicalPatternAnalysis(history : [HistoryItem]) : async [[Text]] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform historical pattern analysis");
    };

    let patterns = _findPatterns(history, 3);

    _updateHistoricalPatterns(patterns);

    patterns;
  };

  public shared ({ caller }) func uploadHistoricalPatterns(patterns : [[Text]]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can upload historical patterns");
    };

    _updateHistoricalPatterns(patterns);
  };

  public query ({ caller }) func getPrediction(history : [HistoryItem]) : async BigSmallPrediction {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get predictions");
    };

    // Simple prediction logic based on patterns and bias
    let (bigCount, smallCount) = _countBigSmall(history);
    let (hasSwitch, switchCount) = _checkSwitchTrend(history);

    let prediction = if (bigCount > smallCount and lossStreak < 3) {
      "Small";
    } else if (smallCount > bigCount and lossStreak < 3) {
      "Big";
    } else if (hasSwitch and switchCount > 5) {
      if (history.size() > 0 and Text.equal(history[history.size() - 1].result, "Big")) {
        "Small";
      } else {
        "Big";
      };
    } else {
      "Big";
    };

    let explanation = "Prediction based on historical patterns, bias analysis, and streak detection";

    { prediction; explanation };
  };

  func _countBigSmall(history : [HistoryItem]) : (Nat, Nat) {
    var bigCount = 0;
    var smallCount = 0;

    for (item in history.values()) {
      if (Text.equal(item.result, "Big")) {
        bigCount += 1;
      } else if (Text.equal(item.result, "Small")) {
        smallCount += 1;
      };
    };

    (bigCount, smallCount);
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

  func _checkSwitchTrend(history : [HistoryItem]) : (Bool, Nat) {
    var hasSwitch = false;
    var switchCount = 0;

    if (history.size() == 0) { return (false, 0) };

    let firstResult = history[0].result;

    for (item in history.values()) {
      if (not Text.equal(item.result, firstResult)) {
        hasSwitch := true;
        switchCount += 1;
      };
    };

    (hasSwitch, switchCount);
  };

  func _findPatterns(history : [HistoryItem], patternLength : Nat) : [[Text]] {
    let patternSize = if (history.size() < patternLength) {
      history.size();
    } else {
      patternLength;
    };

    if (patternSize == 0) { return [] };

    let patterns = List.empty<[Text]>();

    var index = 0;
    while (index + patternSize <= history.size()) {
      let endIndex = index + patternSize;
      if (endIndex > history.size()) { return patterns.toArray() };

      let slice = history.sliceToArray(index, endIndex);
      patterns.add(slice.map(func(item) { item.result }));
      index += 1;
    };

    patterns.toArray();
  };

  func _updateHistoricalPatterns(newPatterns : [[Text]]) {
    historicalPatterns := historicalPatterns.concat(newPatterns);
  };
};
