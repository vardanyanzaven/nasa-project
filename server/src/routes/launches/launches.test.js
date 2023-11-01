const request = require("supertest");
const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");
const { loadPlanetsData } = require("../../models/planets.model");

describe("Launches API tests", () => {
  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetsData();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });

  describe("GET /v1/launches tests", () => {
    it("should respond with 200 success", async () => {
      const response = await request(app)
        .get("/v1/launches")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });

  describe("POST /v1/launches tests", () => {
    const launchData = {
      mission: "USS Enterprise",
      rocket: "NCC 1071-D",
      target: "Kepler-62 f",
      launchDate: "June 5, 2035",
    };

    const launchDataWithoutDate = {
      mission: "USS Enterprise",
      rocket: "NCC 1071-D",
      target: "Kepler-62 f",
    };

    const invalidDateLaunchData = {
      ...launchData,
      launchDate: "Invalid date",
    };

    it("should respond with 201 created", async () => {
      jest.setTimeout(10000);

      const response = await request(app)
        .post("/v1/launches")
        .send(launchData)
        .expect("Content-Type", /json/)
        .expect(201);

      const reqDate = new Date(launchData.launchDate).valueOf();
      const resDate = new Date(response.body.launchDate).valueOf();
      expect(resDate).toBe(reqDate);

      expect(response.body).toMatchObject(launchDataWithoutDate);
    });

    it("should catch missing required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithoutDate)
        .expect("Content-Type", /json/)
        .expect(400)
        .expect({ error: "Missing required launch property" });
    });

    it("should catch invalid dates", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(invalidDateLaunchData)
        .expect("Content-Type", /json/)
        .expect(400)
        .expect({ error: "Invalid launch date" });
    });
  });
});
