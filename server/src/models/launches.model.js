const axios = require("axios");
const launchesDB = require("./launches.mongo");
const planets = require("./planets.mongo");

console.log(launchesDB)

const DEFAULT_FLIGHT_NUMBER = 100;

const saveLaunch = async (launch) => {
  await launchesDB.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    { upsert: true }
  );
};

const findLaunch = async (filter) => {
  return await launchesDB.findOne(filter);
};

const SPACEX_API_URL = "https://api.spacexdata.com/v5/launches/query";

const populateLaunches = async () => {
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if(response.status !== 200) {
    console.log("Problem downloading launch data");
    throw new Error("Launch data download failed");
  }

  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc.payloads;
    const customers = payloads.flatMap((payload) => payload.customers);
    const launch = {
      flightNumber: launchDoc.flight_number,
      mission: launchDoc.name,
      rocket: launchDoc.rocket.name,
      launchDate: launchDoc.date_local,
      customers,
      upcoming: launchDoc.upcoming,
      success: launchDoc.success,
    };
    
    await saveLaunch(launch);
  }
};

const loadLaunchData = async () => {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });
  if (firstLaunch) {
    console.log("Launch data already loaded");
  } else {
    await populateLaunches();
  }
};

const existsLaunchWithId = async (launchId) => {
  return await findLaunch({
    flightNumber: launchId,
  });
};

const getLatestFlightNumber = async () => {
  // Sorts the documents in descending order(- in -flightNumber) and returns the one with the biggest num
  const latestLaunch = await launchesDB.findOne().sort("-flightNumber");

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
};

const getAllLaunches = async (skip, limit) =>
  await launchesDB
    .find({}, { _id: 0, __v: 0 })
    .sort("flightNumber")
    .skip(skip)
    .limit(limit);

const scheduleNewLaunch = async (launch) => {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("No matching planet was found");
  }

  const newFlightNumber = (await getLatestFlightNumber()) + 1;

  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ["ZTM", "NASA"],
    flightNumber: newFlightNumber,
  });

  await saveLaunch(newLaunch);
};

const abortLaunchById = async (launchId) => {
  const abortedLaunch = await launchesDB.updateOne(
    { flightNumber: launchId },
    { upcoming: false, success: false }
  );

  return abortedLaunch.modifiedCount === 1;
};

module.exports = {
  loadLaunchData,
  existsLaunchWithId,
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunchById,
};
