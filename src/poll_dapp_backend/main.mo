import Nat "mo:base/Nat";
import Array "mo:base/Array";

persistent actor {
  type Resolution = {
    id: Nat;
    title: Text;
    description: Text;
    yesVotes: Nat;
    noVotes: Nat;
  };

  stable var resolutions : [Resolution] = [];
  stable var nextId : Nat = 1;

  public shared({caller}) func createResolution(title: Text, description: Text) : async Nat {
    let res : Resolution = {
      id = nextId;
      title = title;
      description = description;
      yesVotes = 0;
      noVotes = 0;
    };
    resolutions := Array.append(resolutions, [res]);
    nextId += 1;
    return res.id;
  };

  public query func getResolutions() : async [Resolution] {
    return resolutions;
  };

  public shared({caller}) func vote(resolutionId: Nat, voteYes: Bool) : async Bool {
    var found = false;
    resolutions := Array.map<Resolution, Resolution>(resolutions, func (r) {
      if (r.id == resolutionId) {
        found := true;
        if (voteYes) {
          { r with yesVotes = r.yesVotes + 1 }
        } else {
          { r with noVotes = r.noVotes + 1 }
        }
      } else {
        r
      }
    });
    return found;
  };
}
