import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

module {
  type HistoryItem = {
    result : Text;
    timestamp : Int;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    historyStore : Map.Map<Principal, List.List<HistoryItem>>;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    historyStore : Map.Map<Principal, List.List<HistoryItem>>;
  };

  public func run(old : OldActor) : NewActor {
    let newHistoryStore = old.historyStore.map<Principal, List.List<HistoryItem>, List.List<HistoryItem>>(
      func(_principal, history) {
        let newList = List.empty<HistoryItem>();
        var count = 0;

        for (item in history.values()) {
          if (count < 30) {
            newList.add(item);
            count += 1;
          };
        };
        newList;
      }
    );
    { old with historyStore = newHistoryStore };
  };
};
