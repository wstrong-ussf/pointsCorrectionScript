import dotenv from "dotenv";

// Parsing the env file.
// dotenv.config({ path: path.resolve(__dirname, "./.env") });
dotenv.config()

// Loading process.env as ENV interface

const getConfig = () => {
  return {
    NODE_ENV: process.env.NODE_ENV,
    HTTP_PORT: process.env.HTTP_PORT ? Number(process.env.HTTP_PORT) : undefined,

    OPENLOYALTY_API_KEY: process.env.OPENLOYALTY_API_KEY,
    OPENLOYALTY_URL: process.env.OPENLOYALTY_URL,
    OPENLOYALTY_ENV: process.env.OPENLOYALTY_ENV
  };
};

// Throwing an Error if any field was undefined we don't 
// want our app to run if it can't connect to DB and ensure 
// that these fields are accessible. If all is good return
// it as Config which just removes the undefined from our type 
// definition.

const getSanitzedConfig = (config) => {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing key ${key} in config.env`);
    }
  }
  return config;
};

const config = getConfig();

const sanitizedConfig = getSanitzedConfig(config);

export default sanitizedConfig;
