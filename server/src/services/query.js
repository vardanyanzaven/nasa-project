// Mongo will return everything if the parameter is set to 0
const DEFAULT_PAGE_LIMIT = 0;

const DEFAULT_PAGE_NUMBER = 1;

const getPagination = (query) => {
    console.log("query", query);
    
  const limit = Math.abs(query.limit) || DEFAULT_PAGE_LIMIT;
  const page = Math.abs(query.page) || DEFAULT_PAGE_NUMBER;
  const skip = limit * (page - 1);

  return {
    skip,
    limit,
  };
};

module.exports = getPagination;
