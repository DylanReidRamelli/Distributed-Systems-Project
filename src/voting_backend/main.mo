import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";

actor VotingBackend {
  
  public type Poll = {
    pollId: Nat;
    pollTitle: Text;
    pollDescription: Text;
    pollCreator: Principal;
    createdAt: Nat; // timestamp would be nice but keeping it simple
    yesVoteCount: Nat;
    noVoteCount: Nat;
  };

  stable var allPollsArray: [Poll] = [];
  stable var nextPollId: Nat = 1;

  stable var votersByPollIdEntries: [(Nat, [Principal])] = [];
  var votersByPollId: HashMap.HashMap<Nat, [Principal]> = HashMap.fromIter(Iter.fromArray(votersByPollIdEntries), 0, Nat.equal, func(x: Nat) : Nat { x });

  func hasUserVotedOnPoll(pollIdToCheck: Nat, userPrincipal: Principal): Bool {
    switch (votersByPollId.get(pollIdToCheck)) {
      case null { return false; };
      case (?votersList) {
        for (voter in votersList.vals()) {
          if (Principal.equal(voter, userPrincipal)) {
            return true;
          }
        };
        return false;
      };
    };
  };

  func addVoterToPoll(pollIdToAdd: Nat, userPrincipal: Principal) {
    switch (votersByPollId.get(pollIdToAdd)) {
      case null {
        votersByPollId.put(pollIdToAdd, [userPrincipal]);
      };
      case (?existingVoters) {
        let newVotersList = Array.append(existingVoters, [userPrincipal]);
        votersByPollId.put(pollIdToAdd, newVotersList);
      };
    };
  };

  public shared({caller}) func createPoll(pollTitleText: Text, pollDescriptionText: Text): async Nat {
    let newPoll: Poll = {
      pollId = nextPollId;
      pollTitle = pollTitleText;
      pollDescription = pollDescriptionText;
      pollCreator = caller;
      createdAt = 0;
      yesVoteCount = 0;
      noVoteCount = 0;
    };
    
    allPollsArray := Array.append(allPollsArray, [newPoll]);
    nextPollId := nextPollId + 1;
    
    return newPoll.pollId;
  };

  public query func getAllPolls(): async [Poll] {
    return allPollsArray;
  };

  public query func getPollById(pollIdToGet: Nat): async ?Poll {
    for (poll in allPollsArray.vals()) {
      if (poll.pollId == pollIdToGet) {
        return ?poll;
      }
    };
    return null;
  };

  public shared({caller}) func voteOnPoll(pollIdToVoteOn: Nat, voteChoice: Bool): async Bool {
    var pollExists: Bool = false;
    var pollIndex: Nat = 0;
    
    if (allPollsArray.size() == 0) {
      return false;
    };
    
    for (i in Iter.range(0, allPollsArray.size() - 1)) {
      if (allPollsArray[i].pollId == pollIdToVoteOn) {
        pollExists := true;
        pollIndex := i;
      };
    };

    if (not pollExists) {
      return false;
    };

    if (hasUserVotedOnPoll(pollIdToVoteOn, caller)) {
      return false;
    };

    let currentPoll = allPollsArray[pollIndex];
    let updatedPoll: Poll = if (voteChoice) {
      {
        currentPoll with yesVoteCount = currentPoll.yesVoteCount + 1;
      }
    } else {
      {
        currentPoll with noVoteCount = currentPoll.noVoteCount + 1;
      }
    };

    var updatedPollsArray: [Poll] = [];
    if (allPollsArray.size() > 0) {
      for (i in Iter.range(0, allPollsArray.size() - 1)) {
        if (i == pollIndex) {
          updatedPollsArray := Array.append(updatedPollsArray, [updatedPoll]);
        } else {
          updatedPollsArray := Array.append(updatedPollsArray, [allPollsArray[i]]);
        };
      };
      allPollsArray := updatedPollsArray;
    };

    addVoterToPoll(pollIdToVoteOn, caller);

    return true;
  };

  system func preupgrade() {
    votersByPollIdEntries := Iter.toArray(votersByPollId.entries());
  };

  system func postupgrade() {
    votersByPollId := HashMap.fromIter(Iter.fromArray(votersByPollIdEntries), 0, Nat.equal, func(x: Nat) : Nat { x });
    votersByPollIdEntries := [];
  };
};

