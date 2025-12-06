import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";

// This is the main actor for our voting system
// It stores polls and votes, and prevents double voting
actor VotingBackend {
  
  // Define what a poll looks like
  public type Poll = {
    pollId: Nat;
    pollTitle: Text;
    pollDescription: Text;
    pollCreator: Principal;
    createdAt: Nat; // timestamp would be nice but keeping it simple
    yesVoteCount: Nat;
    noVoteCount: Nat;
  };

  // Store all the polls we have
  stable var allPollsArray: [Poll] = [];
  stable var nextPollId: Nat = 1;

  // This is to track who voted on what poll
  // We use this to prevent double voting
  // Key: pollId, Value: array of principals who voted
  stable var votersByPollIdEntries: [(Nat, [Principal])] = [];
  var votersByPollId: HashMap.HashMap<Nat, [Principal]> = HashMap.fromIter(Iter.fromArray(votersByPollIdEntries), 0, Nat.equal, func(x: Nat) : Nat { x });

  // Helper function to check if someone already voted
  func hasUserVotedOnPoll(pollIdToCheck: Nat, userPrincipal: Principal): Bool {
    switch (votersByPollId.get(pollIdToCheck)) {
      case null { return false; };
      case (?votersList) {
        // Check if this principal is in the list
        for (voter in votersList.vals()) {
          if (Principal.equal(voter, userPrincipal)) {
            return true;
          }
        };
        return false;
      };
    };
  };

  // Helper function to add a voter to the list
  func addVoterToPoll(pollIdToAdd: Nat, userPrincipal: Principal) {
    switch (votersByPollId.get(pollIdToAdd)) {
      case null {
        // First vote on this poll
        votersByPollId.put(pollIdToAdd, [userPrincipal]);
      };
      case (?existingVoters) {
        // Add to existing list
        let newVotersList = Array.append(existingVoters, [userPrincipal]);
        votersByPollId.put(pollIdToAdd, newVotersList);
      };
    };
  };

  // Create a new poll
  public shared({caller}) func createPoll(pollTitleText: Text, pollDescriptionText: Text): async Nat {
    let newPoll: Poll = {
      pollId = nextPollId;
      pollTitle = pollTitleText;
      pollDescription = pollDescriptionText;
      pollCreator = caller;
      createdAt = 0; // We could add timestamp but keeping it simple for now
      yesVoteCount = 0;
      noVoteCount = 0;
    };
    
    // Add to our array of polls
    allPollsArray := Array.append(allPollsArray, [newPoll]);
    
    // Increment for next poll
    nextPollId := nextPollId + 1;
    
    // Return the poll ID so frontend knows which one was created
    return newPoll.pollId;
  };

  // Get all polls
  public query func getAllPolls(): async [Poll] {
    return allPollsArray;
  };

  // Get a specific poll by ID
  public query func getPollById(pollIdToGet: Nat): async ?Poll {
    for (poll in allPollsArray.vals()) {
      if (poll.pollId == pollIdToGet) {
        return ?poll;
      }
    };
    return null;
  };

  // Vote on a poll
  public shared({caller}) func voteOnPoll(pollIdToVoteOn: Nat, voteChoice: Bool): async Bool {
    // First check if poll exists
    var pollExists: Bool = false;
    var pollIndex: Nat = 0;
    
    // Check if array is empty first
    if (allPollsArray.size() == 0) {
      return false; // No polls exist
    };
    
    for (i in Iter.range(0, allPollsArray.size() - 1)) {
      if (allPollsArray[i].pollId == pollIdToVoteOn) {
        pollExists := true;
        pollIndex := i;
      };
    };

    if (not pollExists) {
      return false; // Poll doesn't exist
    };

    // Check if user already voted
    if (hasUserVotedOnPoll(pollIdToVoteOn, caller)) {
      return false; // Already voted, can't vote again
    };

    // Update the vote counts
    let currentPoll = allPollsArray[pollIndex];
    let updatedPoll: Poll = if (voteChoice) {
      // Voting yes
      {
        currentPoll with yesVoteCount = currentPoll.yesVoteCount + 1;
      }
    } else {
      // Voting no
      {
        currentPoll with noVoteCount = currentPoll.noVoteCount + 1;
      }
    };

    // Replace in array (this is immutable storage - we're creating new array)
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

    // Record that this user voted
    addVoterToPoll(pollIdToVoteOn, caller);

    return true; // Success!
  };

  // System function to save state before upgrade
  system func preupgrade() {
    votersByPollIdEntries := Iter.toArray(votersByPollId.entries());
  };

  // System function to restore state after upgrade
  system func postupgrade() {
    votersByPollId := HashMap.fromIter(Iter.fromArray(votersByPollIdEntries), 0, Nat.equal, func(x: Nat) : Nat { x });
    votersByPollIdEntries := [];
  };
};

