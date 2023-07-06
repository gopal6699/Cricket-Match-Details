const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT 
        *
    FROM
        player_details`;
  const players = await db.all(getPlayerQuery);
  response.send(
    players.map((eachPlayer) =>
      convertPlayerDetailsDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
        * 
    FROM 
        player_details 
    WHERE 
        player_id = ${playerId}`;
  const getPlayer = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailsDbObjectToResponseObject(getPlayer));
});

//Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE 
        player_details 
    SET 
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId}`;
  const player = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
        * 
    FROM 
        match_details 
    WHERE 
        match_id = ${matchId}`;
  const matchDetails = await db.get(getMatchQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(matchDetails));
});

//Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `
    SELECT 
        *
    FROM 
        match_details
    NATURAL JOIN 
        player_match_score
    WHERE 
        player_id = ${playerId}`;
  const matchDetails = await db.all(getPlayerMatches);
  response.send(
    matchDetails.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});

//Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesPlayerQuery = `
    SELECT 
        *
    FROM 
        player_match_score
    NATURAL JOIN 
        player_details
    WHERE 
        match_id = ${matchId}`;
  const playersArray = await db.all(getMatchesPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDetailsDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `
    SELECT 
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM
        player_match_score
    NATURAL JOIN player_details
    WHERE
        player_id = ${playerId}`;
  const playerStats = await db.get(getPlayerStatsQuery);
  response.send(playerStats);
});

//Export the express instance using the default export syntax
module.exports = app;
