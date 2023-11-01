const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");

const planets = require("./planets.mongo");

const isHabitablePlanet = (planet) => {
  // Criteria for sorting out habitable planets: confirmed disposition, amount of sunlight and planet radius(by NASA)
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
};

const savePlanet = async (planet)  => {
  // insert + update = upsert
  try {
    await planets.updateOne(
      {
        keplerName: planet.kepler_name,
      },
      { keplerName: planet.kepler_name },
      {
        upsert: true,
      }
    );
  } catch(err) {
    console.error(`Could not save planet ${planet}`)
  }
}

// Streaming data and piping(sending) it to csv-parse

const loadPlanetsData = async () => {
  fs
    .createReadStream(
      path.join(__dirname, "..", "..", "data", "kepler_data.csv")
    )
    .pipe(
      parse({
        comment: "#",
        columns: true,
      })
    )
    .on("data", async (data) => {
      if (isHabitablePlanet(data)) {
        await savePlanet(data);
      }
    })
    .on("end", async () => {
      const countPlanetsFound = (await getAllPlanets()).length;
      console.log(`${countPlanetsFound} habitable planets found!`);
      return;
    })
    .on("error", (err) => {
      console.log(err);
      return err;
    });
};

const getAllPlanets = async () => await planets.find({}, {
  "__v": 0,
  "_id": 0,
});

module.exports = { loadPlanetsData, getAllPlanets };
