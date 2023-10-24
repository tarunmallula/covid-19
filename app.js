const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const app = express();
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertState = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

const convertDistrict = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const stateQuery = `
        SELECT * FROM state;`;
  const stateResponse = await database.all(stateQuery);
  console.log(stateResponse);
  response.send(stateResponse.map((each) => convertState(each)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const reqState = `
        SELECT * FROM state WHERE state_ID = ${stateId};`;
  const reqStateQuery = await database.get(reqState);
  response.send(convertState(reqStateQuery));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtQuery = `
        INSERT INTO 
          district (district_name,state_id,cases,cured,active,deaths)
          VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const postState = await database.run(districtQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtReq = `
    SELECT * FROM district WHERE district_id = ${districtId};`;
  const districtReqRes = await database.get(districtReq);
  response.send(convertDistrict(districtReqRes));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
        DELETE FROM district WHERE district_id = ${districtId};`;
  await database.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const putQuery = `
        UPDATE district 
          SET district_name = '${districtName}',
              state_id = ${stateId},
              cases = ${cases},
              cured = ${cured},
              active = ${active},
              deaths = ${deaths}
          WHERE districtId = ${districtId};`;
  await database.run(putQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `
        SELECT 
            SUM(cases),
            SUM(cured),
            SUM(active),
            SUM(deaths)
        FROM district
        WHERE state_id = ${stateId};`;
  await database.get(getQuery);
  response.send({
    totalCases: ["SUM(cases)"],
    totalCured: ["SUM(cured)"],
    totalActive: ["SUM(active)"],
    totalDeaths: ["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateIdQuery = `
        SELECT state_id 
        FROM district
        WHERE district_id = ${districtId};`;
  const stateIdRes = await db.get(stateIdQuery);
  const stateNameQuery = `
        SELECT state_name AS stateName
        FROM state
        WHERE state_id = ${stateIdRes.state_id};`;
  const stateNameRes = await database.get(stateNameQuery);
  response.send(stateNameRes);
});

module.exports = app;
