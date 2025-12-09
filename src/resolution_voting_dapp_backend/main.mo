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

  public type TokenType = {
    #Circle;
    #Square;
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

  // balances: (Principal, TokenType, Nat) list
  stable var balances : [(Principal, TokenType, Nat)] = [];
  stable var votersByResolution : [(ResolutionId, [Principal])] = []; // Saves the voters who has voted

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

  func findBalanceIndex(who : Principal, token : TokenType) : ?Nat {
    var i : Nat = 0;
    let n = balances.size();
    while (i < n) {
      let (p, t, _) = balances[i];
      if (p == who and t == token) {
        return ?i;
      };
      i += 1;
    };
    null;
  };

  func getBalanceInternal(who : Principal, token : TokenType) : Nat {
    switch (findBalanceIndex(who, token)) {
      case (null) { 0 };
      case (?idx) {
        let (_, _, amount) = balances[idx];
        amount;
      };
    }
  };

  func setBalance(who : Principal, token : TokenType, amount : Nat) {
    switch (findBalanceIndex(who, token)) {
      case (null) {
        balances := Array.append<(Principal, TokenType, Nat)>(
          balances,
          [(who, token, amount)]
        );
      };
      case (?idx) {
        let n = balances.size();
        var acc : [(Principal, TokenType, Nat)] = [];
        var i : Nat = 0;
        while (i < n) {
          if (i == idx) {
            acc := Array.append<(Principal, TokenType, Nat)>(acc, [(who, token, amount)]);
          } else {
            acc := Array.append<(Principal, TokenType, Nat)>(acc, [balances[i]]);
          };
          i += 1;
        };
        balances := acc;
      };
    }
  };

// prevents double voting: add hash for votes and rocord voters
// functions to check double voting
  func hasVoted(id : ResolutionId, who : Principal) : Bool {
    var i : Nat = 0;
    let n = votersByResolution.size();
    while (i < n) {
      let (rid, voters) = votersByResolution[i];
      if (rid == id) {
        var j : Nat = 0;
        let m = voters.size();
        while (j < m) {
          if (Principal.equal(voters[j], who)) {
            return true;
          };
          j += 1;
        };
        return false;
      };
      i += 1;
    };
    false;
  };

  func addVoter(id : ResolutionId, who : Principal) {
    var i : Nat = 0;
    let n = votersByResolution.size();
    var found : Bool = false;
    var updated : [(ResolutionId, [Principal])] = [];
    while (i < n) {
      let (rid, voters) = votersByResolution[i];
      if (rid == id) {
        found := true;
        let newVoters = Array.append<Principal>(voters, [who]);
        updated := Array.append<(ResolutionId, [Principal])>(updated, [(rid, newVoters)]);
      } else {
        updated := Array.append<(ResolutionId, [Principal])>(updated, [(rid, voters)]);
      };
      i += 1;
    };
    if (not found) {
      updated := Array.append<(ResolutionId, [Principal])>(updated, [(id, [who])]);
    };
    votersByResolution := updated;
  };

  // ---------- Public API ----------

  /// Faucet for Circle token: give the caller 1 Circle token.
  public shared ({ caller }) func faucetCircle() : async Nat {
    let current = getBalanceInternal(caller, #Circle);
    setBalance(caller, #Circle, current + 1);
    getBalanceInternal(caller, #Circle);
  };

  /// Faucet for Square token: give the caller 25 Square tokens.
  public shared ({ caller }) func faucetSquare() : async Nat {
    let current = getBalanceInternal(caller, #Square);
    setBalance(caller, #Square, current + 25);
    getBalanceInternal(caller, #Square);
  };

  /// Get all balances for the caller.
  public shared ({ caller }) func getMyBalances() : async [(TokenType, Nat)] {
    var result : [(TokenType, Nat)] = [];
    let n = balances.size();
    var i : Nat = 0;
    while (i < n) {
      let (p, t, amount) = balances[i];
      if (p == caller) {
        result := Array.append<(TokenType, Nat)>(result, [(t, amount)]);
      };
      i += 1;
    };
    result;
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

  /// Vote on a resolution with a token amount and type.
  public shared ({ caller }) func voteResolution(
    id : ResolutionId,
    choice : VoteChoice,
    token : TokenType,
    amount : Nat
  ) : async { #ok : Resolution; #err : Text } {

    if (amount == 0) {
      return #err("Amount must be > 0");
    };

    let bal = getBalanceInternal(caller, token);
    if (bal < amount) {
      return #err("Insufficient tokens to vote");
    };

    switch (findResolutionIndex(id)) {
      case (null) {
        return #err("Resolution not found");
      };
      case (?idx) {
        if (hasVoted(id, caller)) {
          return #err("You has already voted for this post");
        };
        let r = resolutions[idx];

        // spend tokens
        setBalance(caller, token, bal - amount);

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
        addVoter(id, caller);
        #ok(updated);
      };
    };
  };

}
