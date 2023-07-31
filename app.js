const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// GET API1 List all States
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `SELECT * FROM state ORDER BY state_id;`;
  const statesArray = await db.all(getAllStatesQuery);
  //response.send(statesArray);
  const ans = (statesArray) => {
    return {
      stateId: statesArray.state_id,
      stateName: statesArray.state_name,
      population: statesArray.population,
    };
  };
  response.send(statesArray.map((eachState) => ans(eachState)));
});

// Get API2 List one State based on the Given ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId}`;
  const state = await db.get(getStateQuery);
  response.send({
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  });
});

// POST API3 Creating a district to district Table.
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  //console.log(districtDetails);
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  //console.log(`${districtName}, ${stateId}, ${cases}, ${cured}, ${active}, ${deaths}`);
  const addDirectorQuery = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths) 
    VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  const dbResponse = await db.run(addDirectorQuery);
  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});

// GET API4 Returns a district on districtId.
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId}`;
  const districtDetails = await db.get(getDistrictQuery);
  response.send({
    districtId: districtDetails.district_id,
    districtName: districtDetails.district_name,
    stateId: districtDetails.state_id,
    cases: districtDetails.cases,
    cured: districtDetails.cured,
    active: districtDetails.active,
    deaths: districtDetails.deaths,
  });
});

// DELETE API5 Deleting district based on the district_id.
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId}`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// PUT API6 Updating details of specific district based on district_id.
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  //console.log(districtId);
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  //console.log(`${districtName}, ${stateId}, ${cases}, ${cured}, ${active}, ${deaths}`);
  const updateDistrictDetails = ` 
    UPDATE district 
    SET district_name = '${districtName}', state_id = ${stateId}, cases = '${cases}' , cured = ${cured}, active = ${active}, deaths = ${deaths}
    WHERE district_id = ${districtId};`;
  await db.run(updateDistrictDetails);
  response.send("District Details Updated");
});

// GET API7 Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `SELECT SUM(cases), SUM(cured), SUM(active), SUM(deaths) FROM district WHERE state_id = ${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  //console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

// GET API8 Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `SELECT state_id FROM district WHERE district_id = ${districtId};`;
  //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `SELECT state_name as stateName FROM state WHERE state_id = ${getDistrictIdQueryResponse.state_id};`;
  //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse); // Sending the required Response.
});

module.exports = app;
