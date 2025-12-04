import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Array "mo:base/Array";

persistent actor {

  // ---------- Types ----------

  public type ResolutionId = Nat;

  public type VoteChoice = {
    #For;
    #Against;
    #Abstain;
  };

  public type Resolution = {
    id : ResolutionId;
    creator : Principal;
    title : Text;
    description : Text;
    created_at : Nat64;
    for_weight : Nat;
    against_weight : Nat;
    abstain_weight : Nat;
  };

  // ---------- Stable state ----------

  stable var resolutions : [Resolution] = [];
  stable var nextId : ResolutionId = 0;

  // balances: simple (Principal, Nat) list
  stable var balances : [(Principal, Nat)] = [];

  // ---------- Helpers ----------

  func nowNs() : Nat64 {
    Nat64.fromIntWrap(Time.now());
  };

  func findResolutionIndex(id : ResolutionId) : ?Nat {
    var i : Nat = 0;
    let n = resolutions.size();
    while (i < n) {
      if (resolutions[i].id == id) {
        return ?i;
      };
      i += 1;
    };
    null;
  };

  func replaceResolutionAt(idx : Nat, r : Resolution) {
    let n = resolutions.size();
    var acc : [Resolution] = [];
    var i : Nat = 0;
    while (i < n) {
      if (i == idx) {
        acc := Array.append<Resolution>(acc, [r]);
      } else {
        acc := Array.append<Resolution>(acc, [resolutions[i]]);
      };
      i += 1;
    };
    resolutions := acc;
  };

  func findBalanceIndex(who : Principal) : ?Nat {
    var i : Nat = 0;
    let n = balances.size();
    while (i < n) {
      let (p, _) = balances[i];
      if (p == who) {
        return ?i;
      };
      i += 1;
    };
    null;
  };

  func getBalanceInternal(who : Principal) : Nat {
    switch (findBalanceIndex(who)) {
      case (null) { 0 };
      case (?idx) {
        let (_, amount) = balances[idx];
        amount;
      };
    }
  };

  func setBalance(who : Principal, amount : Nat) {
    switch (findBalanceIndex(who)) {
      case (null) {
        balances := Array.append<(Principal, Nat)>(
          balances,
          [(who, amount)]
        );
      };
      case (?idx) {
        let n = balances.size();
        var acc : [(Principal, Nat)] = [];
        var i : Nat = 0;
        while (i < n) {
          if (i == idx) {
            acc := Array.append<(Principal, Nat)>(acc, [(who, amount)]);
          } else {
            acc := Array.append<(Principal, Nat)>(acc, [balances[i]]);
          };
          i += 1;
        };
        balances := acc;
      };
    }
  };

  // ---------- Public API ----------

  /// Simple faucet: give the caller 100 tokens if they have 0.
  public shared ({ caller }) func faucet() : async Nat {
    let current = getBalanceInternal(caller);
    if (current == 0) {
      setBalance(caller, 100);
    };
    getBalanceInternal(caller);
  };

  /// Get the caller's token balance.
  public shared ({ caller }) func getMyBalance() : async Nat {
    getBalanceInternal(caller);
  };

  /// Create a new resolution.
  public shared ({ caller }) func createResolution(
    title : Text,
    description : Text
  ) : async { #ok : ResolutionId; #err : Text } {
    if (title == "") {
      return #err("Title cannot be empty");
    };

    let id = nextId;
    nextId += 1;

    let res : Resolution = {
      id = id;
      creator = caller;
      title = title;
      description = description;
      created_at = nowNs();
      for_weight = 0;
      against_weight = 0;
      abstain_weight = 0;
    };

    resolutions := Array.append<Resolution>(resolutions, [res]);
    #ok(id);
  };

  /// List all resolutions (visible to everyone).
  public query func listResolutions() : async [Resolution] {
    resolutions;
  };

  /// Get a single resolution by id.
  public query func getResolution(id : ResolutionId) : async ?Resolution {
    switch (findResolutionIndex(id)) {
      case (null) { null };
      case (?idx) { ?resolutions[idx] };
    }
  };

  /// Vote on a resolution with a token amount.
  public shared ({ caller }) func voteResolution(
    id : ResolutionId,
    choice : VoteChoice,
    amount : Nat
  ) : async { #ok : Resolution; #err : Text } {

    if (amount == 0) {
      return #err("Amount must be > 0");
    };

    let bal = getBalanceInternal(caller);
    if (bal < amount) {
      return #err("Insufficient tokens to vote");
    };

    switch (findResolutionIndex(id)) {
      case (null) {
        return #err("Resolution not found");
      };
      case (?idx) {
        let r = resolutions[idx];

        // spend tokens
        setBalance(caller, bal - amount);

        let updated : Resolution = switch (choice) {
          case (#For) {
            {
              id = r.id;
              creator = r.creator;
              title = r.title;
              description = r.description;
              created_at = r.created_at;
              for_weight = r.for_weight + amount;
              against_weight = r.against_weight;
              abstain_weight = r.abstain_weight;
            }
          };
          case (#Against) {
            {
              id = r.id;
              creator = r.creator;
              title = r.title;
              description = r.description;
              created_at = r.created_at;
              for_weight = r.for_weight;
              against_weight = r.against_weight + amount;
              abstain_weight = r.abstain_weight;
            }
          };
          case (#Abstain) {
            {
              id = r.id;
              creator = r.creator;
              title = r.title;
              description = r.description;
              created_at = r.created_at;
              for_weight = r.for_weight;
              against_weight = r.against_weight;
              abstain_weight = r.abstain_weight + amount;
            }
          };
        };

        replaceResolutionAt(idx, updated);
        #ok(updated);
      };
    };
  };

}
