import axios from "axios";

axios.post("https://covid19-project-production-8875.up.railway.app/predict", {
  age: 45,
  gender: 0,
  marital_status: 1,
  employment_status: 0,
  region: 0,
  prev_chronic_conditions: 1,
  allergic_reaction: 0,
  receiving_immu0therapy: 0
}).then(res => {
  console.log(JSON.stringify(res.data, null, 2));
}).catch(err => {
  console.error("Error:", err.message);
});
