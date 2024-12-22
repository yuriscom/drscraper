var ApiProcessor = require(__dirname + "/ds/api-processor");


exports = module.exports = function (options, callback) {
  console.log("inside task");
  var proc = new ApiProcessor(options, callback);
  proc.run().then((filepath) => {
    callback(filepath);
  }).catch((err) => {
    callback(null, err);
  })

  // proc.mockDoctorRequest();
}