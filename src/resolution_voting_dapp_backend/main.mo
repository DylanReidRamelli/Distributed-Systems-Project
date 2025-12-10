import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Text "mo:base/Text";

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
    expires_at : Nat64; // expiration timestamp
    for_weight : Nat;
    against_weight : Nat;
    abstain_weight : Nat;
  };

  // ---------- Stable state ----------

  stable var resolutions : [Resolution] = [];
  stable var nextId : ResolutionId = 0;
  stable var balances : [(Principal, TokenType, Nat)] = [];
  public type VoteRecord = {
    voter : Principal;
    choice : VoteChoice;
    token : TokenType;
    amount : Nat;
    weight : Nat;
    timestamp : Nat64;
  };

  stable var votersByResolution : [(ResolutionId, [VoteRecord])] = [];

  // ---------- Helpers ----------

  func nowNs() : Nat64 {
    Nat64.fromIntWrap(Time.now());
  };

  func getTokenWeight(token : TokenType) : Nat {
    switch (token) {
      case (#Circle) { 1 };
      case (#Square) { 10 };
    }
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

  func hasVoted(id : ResolutionId, who : Principal) : Bool {
    var i : Nat = 0;
    let n = votersByResolution.size();
    while (i < n) {
      let (resId, votes) = votersByResolution[i];
      if (resId == id) {
        var j : Nat = 0;
        let m = votes.size();
        while (j < m) {
          if (votes[j].voter == who) {
            return true;
          };
          j += 1;
        };
      };
      i += 1;
    };
    false;
  };

  func addVoterRecord(id : ResolutionId, vote : VoteRecord) {
    var found = false;
    var i : Nat = 0;
    let n = votersByResolution.size();
    var acc : [(ResolutionId, [VoteRecord])] = [];
    while (i < n) {
      let (resId, votes) = votersByResolution[i];
      if (resId == id) {
        found := true;
        acc := Array.append<(ResolutionId, [VoteRecord])>(
          acc,
          [(resId, Array.append<VoteRecord>(votes, [vote]))]
        );
      } else {
        acc := Array.append<(ResolutionId, [VoteRecord])>(acc, [(resId, votes)]);
      };
      i += 1;
    };
    if (not found) {
      acc := Array.append<(ResolutionId, [VoteRecord])>(acc, [(id, [vote])]);
    };
    votersByResolution := acc;
  };

  func getVotesFor(id : ResolutionId) : [VoteRecord] {
    var i : Nat = 0;
    let n = votersByResolution.size();
    while (i < n) {
      let (resId, votes) = votersByResolution[i];
      if (resId == id) { return votes; };
      i += 1;
    };
    [];
  };

  func isExpired(r : Resolution) : Bool {
    r.expires_at <= nowNs();
  };

  // ---------- Public API ----------

  public shared ({ caller }) func faucetCircle() : async Nat {
    let current = getBalanceInternal(caller, #Circle);
    setBalance(caller, #Circle, current + 1);
    getBalanceInternal(caller, #Circle);
  };

  public shared ({ caller }) func faucetSquare() : async Nat {
    let current = getBalanceInternal(caller, #Square);
    setBalance(caller, #Square, current + 1);
    getBalanceInternal(caller, #Square);
  };

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

  /// Create a new resolution with a time limit (in seconds, max 600 = 10 minutes).
  public shared ({ caller }) func createResolution(
    title : Text,
    description : Text,
    duration_seconds : Nat64
  ) : async { #ok : ResolutionId; #err : Text } {
    if (title == "") {
      return #err("Title cannot be empty");
    };
    if (Text.size(title) > 200) {
      return #err("Title too long (max 200 chars)");
    };
    if (description == "") {
      return #err("Description cannot be empty");
    };
    if (Text.size(description) > 2000) {
      return #err("Description too long (max 2000 chars)");
    };
    if (duration_seconds == 0 or duration_seconds > 600) {
      return #err("Duration must be between 1 and 600 seconds (10 minutes)");
    };

    let id = nextId;
    nextId += 1;

    let now = nowNs();
    let expires = now + (duration_seconds * 1_000_000_000);

    let res : Resolution = {
      id = id;
      creator = caller;
      title = title;
      description = description;
      created_at = now;
      expires_at = expires;
      for_weight = 0;
      against_weight = 0;
      abstain_weight = 0;
    };

    resolutions := Array.append<Resolution>(resolutions, [res]);
    #ok(id);
  };

  /// List all active resolutions (not expired).
  public query func listActiveResolutions() : async [Resolution] {
    let now = nowNs();
    Array.filter<Resolution>(resolutions, func(r) { r.expires_at > now });
  };

  /// List all expired/done resolutions.
  public query func listExpiredResolutions() : async [Resolution] {
    let now = nowNs();
    Array.filter<Resolution>(resolutions, func(r) { r.expires_at <= now });
  };

  /// Get a single resolution by id.
  public query func getResolution(id : ResolutionId) : async ?Resolution {
    switch (findResolutionIndex(id)) {
      case (null) { null };
      case (?idx) { ?resolutions[idx] };
    }
  };

  /// Vote on a resolution with token amount and type.
  public shared ({ caller }) func voteResolution(
    id : ResolutionId,
    choice : VoteChoice,
    token : TokenType,
    amount : Nat
  ) : async { #ok : Resolution; #err : Text } {

    if (amount == 0) {
      return #err("Amount must be > 0");
    };

    if (hasVoted(id, caller)) {
      return #err("You have already voted on this resolution");
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
        let r = resolutions[idx];

        if (isExpired(r)) {
          return #err("Resolution has expired");
        };

        // Calculate weighted vote
        let tokenWeight = getTokenWeight(token);
        let voteWeight = amount * tokenWeight;

        // Spend tokens
        setBalance(caller, token, bal - amount);

        // Record voter (store full vote record)
        let now = nowNs();
        let voteRec : VoteRecord = {
          voter = caller;
          choice = choice;
          token = token;
          amount = amount;
          weight = voteWeight;
          timestamp = now;
        };
        addVoterRecord(id, voteRec);

        let updated : Resolution = switch (choice) {
          case (#For) {
            {
              id = r.id;
              creator = r.creator;
              title = r.title;
              description = r.description;
              created_at = r.created_at;
              expires_at = r.expires_at;
              for_weight = r.for_weight + voteWeight;
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
              expires_at = r.expires_at;
              for_weight = r.for_weight;
              against_weight = r.against_weight + voteWeight;
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
              expires_at = r.expires_at;
              for_weight = r.for_weight;
              against_weight = r.against_weight;
              abstain_weight = r.abstain_weight + voteWeight;
            }
          };
        };

        replaceResolutionAt(idx, updated);
        #ok(updated);
      };
    };
  };

  /// Return vote records for a given resolution, only after it has expired.
  public query func getVotesForResolution(id : ResolutionId) : async { #ok : [VoteRecord]; #err : Text } {
    switch (findResolutionIndex(id)) {
      case (null) { #err("Resolution not found") };
      case (?idx) {
        let r = resolutions[idx];
        if (not isExpired(r)) {
          return #err("Resolution is still active");
        } else {
          let votes = getVotesFor(id);
          #ok(votes);
        };
      };
    };
  };

}
