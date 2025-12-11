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
    #Triangle;   // NEW
    #Pentagon;   // NEW
  };

  public type Resolution = {
    id : ResolutionId;
    creator : Principal;
    title : Text;
    description : Text;
    created_at : Nat64;
    expires_at : Nat64;
    for_weight : Nat;
    against_weight : Nat;
    abstain_weight : Nat;
    settled : Bool;              // NEW: has rewards been paid
  };

  // Record full vote details
  public type VoteRecord = {
    voter : Principal;
    choice : VoteChoice;
    token : TokenType;
    amount : Nat;   // raw tokens staked
    weight : Nat;   // weighted amount used in tally
  };

  // ---------- Stable state ----------

  stable var resolutions : [Resolution] = [];
  stable var nextId : ResolutionId = 0;
  stable var balances : [(Principal, TokenType, Nat)] = [];
  stable var votesByResolution : [(ResolutionId, [VoteRecord])] = [];

  // ---------- Helpers ----------

  func nowNs() : Nat64 {
    Nat64.fromIntWrap(Time.now());
  };

  func getTokenWeight(token : TokenType) : Nat {
    switch (token) {
      case (#Circle) { 1 };
      case (#Square) { 10 };
      case (#Triangle) { 20 };   // NEW
      case (#Pentagon) { 30 };   // NEW
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
    let n = votesByResolution.size();
    while (i < n) {
      let (resId, votes) = votesByResolution[i];
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

  func addVote(id : ResolutionId, vr : VoteRecord) {
    var found = false;
    var acc : [(ResolutionId, [VoteRecord])] = [];
    for ((rid, vs) in votesByResolution.vals()) {
      if (rid == id) {
        found := true;
        acc := Array.append(acc, [(rid, Array.append(vs, [vr]))]);
      } else {
        acc := Array.append(acc, [(rid, vs)]);
      };
    };
    if (not found) {
      acc := Array.append(acc, [(id, [vr])]);
    };
    votesByResolution := acc;
  };

  func getVotes(id : ResolutionId) : [VoteRecord] {
    for ((rid, vs) in votesByResolution.vals()) {
      if (rid == id) return vs;
    };
    return [];
  };

  public shared ({ caller }) func getMyVotes() : async [VoteRecord] {
    var result : [VoteRecord] = [];
    let n = votesByResolution.size();
    var i : Nat = 0;
    while (i < n) {
      let (rid, vs) = votesByResolution[i];
      var j : Nat = 0;
      let m = vs.size();
      while (j < m) {
        if (vs[j].voter == caller) {
          result := Array.append(result, [vs[j]]);
        };
        j += 1;
      };
      i += 1;
    };
    result;
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

  public shared ({ caller }) func faucetTriangle() : async Nat {       // NEW
    let current = getBalanceInternal(caller, #Triangle);
    setBalance(caller, #Triangle, current + 1);
    getBalanceInternal(caller, #Triangle);
  };

  public shared ({ caller }) func faucetPentagon() : async Nat {       // NEW
    let current = getBalanceInternal(caller, #Pentagon);
    setBalance(caller, #Pentagon, current + 1);
    getBalanceInternal(caller, #Pentagon);
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
      settled = false;
    };

    resolutions := Array.append<Resolution>(resolutions, [res]);
    #ok(id);
  };

  /// List all active resolutions (not expired).
  public query func listActiveResolutions() : async [Resolution] {
    let now = nowNs();
    Array.filter(resolutions, func(r) { r.expires_at > now and not r.settled })
  };

  /// List all expired/done resolutions.
  public query func listExpiredResolutions() : async [Resolution] {
    let now = nowNs();
    Array.filter(resolutions, func(r) { r.expires_at <= now or r.settled })
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
        addVote(id, {
          voter = caller;
          choice = choice;
          token = token;
          amount = amount;
          weight = voteWeight;
        });

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
              settled = r.settled;
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
              settled = r.settled;
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
              settled = r.settled;
            }
          };
        };

        replaceResolutionAt(idx, updated);
        #ok(updated);
      };
    };
  };

  /// Fetch votes for a resolution
  public query func getVotesForResolution(id : ResolutionId) : async { #ok : [VoteRecord]; #err : Text } {
    switch (findResolutionIndex(id)) {
      case (null) { #err("Resolution not found") };
      case (?_) { #ok(getVotes(id)) };
    }
  };

  /// Settle all expired, not-yet-settled resolutions
  public shared ({ caller }) func settleExpired() : async [Resolution] {
    let now = nowNs();
    var settledList : [Resolution] = [];
    var updated : [Resolution] = [];

    for (r in resolutions.vals()) {
      if (r.expires_at <= now and not r.settled) {
        let votes = getVotes(r.id);

        // Totals for bonus computation
        let totalStaked : Nat = Array.foldLeft(votes, 0, func (acc : Nat, v : VoteRecord) : Nat { acc + v.amount });

        // Determine winning choice (no bonus if tie or abstain wins)
        let winner : ?VoteChoice =
          if (r.for_weight > r.against_weight) { ?#For }
          else if (r.against_weight > r.for_weight) { ?#Against }
          else { null };

        // Sum staked on winning side
        let totalWinningStaked : Nat = switch (winner) {
          case (?#For) {
            Array.foldLeft(votes, 0, func (acc, v) { if (v.choice == #For) acc + v.amount else acc })
          };
          case (?#Against) {
            Array.foldLeft(votes, 0, func (acc, v) { if (v.choice == #Against) acc + v.amount else acc })
          };
          case (null) { 0 };
        };

        let bonusPool : Nat = totalStaked / 2; // 50% of all staked, paid in Circle

        // Pay winners
        switch (winner) {
          case (null) {};
          case (wc) {
            for (v in votes.vals()) {
              if (v.choice == wc) {
                // refund original stake in the same token
                let bal0 = getBalanceInternal(v.voter, v.token);
                setBalance(v.voter, v.token, bal0 + v.amount);

                // bonus in Circle, proportional to staked amount
                if (totalWinningStaked > 0 and bonusPool > 0) {
                  let share = bonusPool * v.amount / totalWinningStaked;
                  let balC = getBalanceInternal(v.voter, #Circle);
                  setBalance(v.voter, #Circle, balC + share);
                };
              };
            };
          };
        };

        // mark settled
        settledList := Array.append(settledList, [
          {
            id = r.id;
            creator = r.creator;
            title = r.title;
            description = r.description;
            created_at = r.created_at;
            expires_at = r.expires_at;
            for_weight = r.for_weight;
            against_weight = r.against_weight;
            abstain_weight = r.abstain_weight;
            settled = true;
          }
        ]);

        updated := Array.append(updated, [
          {
            id = r.id;
            creator = r.creator;
            title = r.title;
            description = r.description;
            created_at = r.created_at;
            expires_at = r.expires_at;
            for_weight = r.for_weight;
            against_weight = r.against_weight;
            abstain_weight = r.abstain_weight;
            settled = true;
          }
        ]);
      } else {
        updated := Array.append(updated, [r]);
      };
    };

    resolutions := updated;
    settledList
  };

}
