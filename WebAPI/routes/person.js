var express = require("express");
var router = express.Router();
const PersonModel = require("./../model/person");
const TempPersonModel = require("./../model/tempPerson");

/*
  new person profile creation based on userid
*/
router.post("/create", (request, response) => {
  var Person = {
    PersonId: request.body.PersonId,
    FullName: {
      FirstName: request.body.FirstName,
      MiddleName: request.body.MiddleName,
      LastName: request.body.LastName
    },
    Gender: request.body.Gender,
    DateOfBirth: request.body.DateOfBirth,
    Age: request.body.Age,
    Address: {
      FlatNumber: request.body.FlatNumber,
      SocietyName: request.body.SocietyName,
      AreaName: request.body.AreaName
    },
    City: request.body.City,
    State: request.body.State,
    Pincode: request.body.Pincode,
    PhoneNo: request.body.PhoneNo,
    MobileNo: request.body.MobileNo,
    PhysicalDisability: request.body.PhysicalDisability,
    MaritalStatus: request.body.MaritalStatus,
    Education: request.body.Education,
    BirthSign: request.body.BirthSign
  };
  if (request.body.CreatedBy == 1) {
    PersonModel.create(Person, (err, res) => {
      if (err) {
        response.send({
          status: 500,
          error: err
        });
        return;
      } else {
        response.send({
          status: 200,
          data: res
        });
      }
    });
  } else {
    TempPersonModel.create(Person, (err, res) => {
      if (err) {
        response.send({
          status: 500,
          error: err
        });
        return;
      } else {
        response.send({
          status: 200,
          data: res
        });
      }
    });
  }
});

/*
  getting person profile based on user/person id
*/
router.get("/:pid", (request, response) => {
  // this should be based on approved and pending status
  var pid = request.params.pid;
  PersonModel.find({
    PersonId: pid
  }, (err, data) => {
    if (err) {
      response.send({
        status: 500,
        err: err
      });
      return;
    } else if (data) {
      response.send({
        status: 200,
        data: data
      });
    } else {
      response.send({
        status: 404,
        message: "No Data Found"
      });
    }
  });
});

/*
  getting all person profile based on status like "Pending, Approved and Reject"
*/
router.post("/", (req, res) => {
  if (req.body.isAuthorized === "Approved") {
    PersonModel.find({}, {
      _id: 0,
      PersonId: 1,
      FullName: 1,
      Gender: 1,
      City: 1,
      State: 1
    }).exec((err, person) => {
      if (err) {
        response.send({
          status: 500,
          err: err
        });
        return;
      } else {
        res.send({
          status: 200,
          person: person,
          header: ["Person Id", "Full Name", "Gender", "City", "State"]
        });
      }
    });
  } else if (req.body.isAuthorized === "Pending") {
    // have to use temp person collection
    TempPersonModel.find({}, {
      _id: 0,
      PersonId: 1,
      FullName: 1,
      Gender: 1,
      City: 1,
      State: 1
    }).exec((err, person) => {
      if (err) {
        response.send({
          status: 500,
          err: err
        });
        return;
      } else {
        res.send({
          status: 200,
          person: person,
          header: ["Person Id", "Full Name", "Gender", "City", "State"]
        });
      }
    });
  }
});

/*
  Approving person by admin
*/
router.post("/approve", (request, response) => {
  // getting Person Id
  var pid = request.body.PersonId;

  if (request.body.isAuthorized === "Approved") {
    // getting and removing data from temp_person collection
    TempPersonModel.findOne({
      PersonId: pid
    }, {
      _id: 0,
      __v: 0
    }).exec(
      (err, person) => {
        if (err) {
          response.send({
            status: 500,
            err: err
          });
          return;
        } else if (person) {

          // preparing person model from temp_person model
          let Auth_Person = {
            PersonId: person.PersonId,
            FullName: person.FullName,
            Address: person.Address,
            PhysicalDisability: person.PhysicalDisability,
            BirthSign: person.BirthSign,
            Gender: person.Gender,
            Age: person.Age,
            City: person.City,
            State: person.State,
            Pincode: person.Pincode,
            DateOfBirth: person.DateOfBirth,
            PhoneNo: person.PhoneNo,
            MobileNo: person.MobileNo,
            MaritalStatus: person.MaritalStatus,
            Education: person.Education
          };


          PersonModel.findOneAndUpdate({
            PersonId: Auth_Person.PersonId
          }, Auth_Person, {
            upsert: true
          }, function (err, doc) {
            if (err) {
              return res.send(500, {
                error: err
              });
            }
            TempPersonModel.remove({
              PersonId: pid
            }).exec(err =>
              console.log("deleted")
            );
            // getting all remaining temp person
            TempPersonModel.find({}, {
              _id: 0,
              PersonId: 1,
              FullName: 1,
              Gender: 1,
              City: 1,
              State: 1
            }).exec((err, data) => {
              if (err) {
                response.send({
                  status: 500,
                  err: err
                });
              }
              if (data) {
                response.send({
                  status: 200,
                  person: data,
                  header: [
                    "Person Id",
                    "Full Name",
                    "Gender",
                    "City",
                    "State"
                  ]
                });
              } else {
                response.send({
                  status: 500,
                  message: "some error occured"
                });
              }
            });
          });
        } else {
          response.send({
            status: 404,
            message: "No Data Found"
          });
        }
      }
    );
  } else {
    // rejecting
    TempPersonModel.remove({
      PersonId: pid
    }).exec(err =>
      console.log("deleted")
    );
    // getting all remaining temp person
    TempPersonModel.find({}, {
      _id: 0,
      PersonId: 1,
      FullName: 1,
      Gender: 1,
      City: 1,
      State: 1
    }).exec((err, data) => {
      if (err) {
        response.send({
          status: 500,
          err: err
        });
        return;
      }
      if (data) {
        response.send({
          status: 200,
          data: data,
          header: ["Person Id", "Full Name", "Gender", "City", "State"]
        });
      } else {
        response.send({
          status: 500,
          message: "some error occured"
        });
      }
    });
  }
});

/*
  Updating person information
*/

/*
  update person profile creation based on userid/personid
*/
router.put("/update", (request, response) => {
  var Person = {
    PersonId: request.body.PersonId,
    FullName: {
      FirstName: request.body.FirstName,
      MiddleName: request.body.MiddleName,
      LastName: request.body.LastName
    },
    Gender: request.body.Gender,
    DateOfBirth: request.body.DateOfBirth,
    Age: request.body.Age,
    Address: {
      FlatNumber: request.body.FlatNumber,
      SocietyName: request.body.SocietyName,
      AreaName: request.body.AreaName
    },
    City: request.body.City,
    State: request.body.State,
    Pincode: request.body.Pincode,
    PhoneNo: request.body.PhoneNo,
    MobileNo: request.body.MobileNo,
    PhysicalDisability: request.body.PhysicalDisability,
    MaritalStatus: request.body.MaritalStatus,
    Education: request.body.Education,
    BirthSign: request.body.BirthSign
  };

  if (request.body.CreatedBy == 1) {
    PersonModel.update({
      PersonId: Person.PersonId
    }, Person, (err, res) => {
      if (err) {
        response.send({
          status: 500,
          error: err
        });
        return;
      } else {
        response.send({
          status: 200,
          data: res
        });
      }
    });
  } else {
    TempPersonModel.create({
        PersonId: Person.PersonId
      },
      Person,
      (err, res) => {
        if (err) {
          response.send({
            status: 500,
            error: err
          });
          return;
        } else {
          response.send({
            status: 200,
            data: res
          });
        }
      }
    );
  }
});

module.exports = router;