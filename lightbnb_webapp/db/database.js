const { Pool } = require("pg");

const pool = new Pool({
  user: "development",
  password: "development",
  host: "localhost",
  database: "lightbnb",
});

const properties = require("./json/properties.json");
const users = require("./json/users.json");

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => {
      if (result.rows.length > 0) {
        console.log(result.rows[0]);
        return result.rows[0];
      } else {
        console.log('No user found with that email');
        return null;
      }
    })
    .catch((err) => {
      console.error(err.message);
      return null;
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => {
      if (result.rows.length > 0) {
        console.log(result.rows[0]);
        return result.rows[0];
      } else {
        console.log('No user found with that ID');
        return null;
      }
    })
    .catch((err) => {
      console.error(err.message);
      return null;
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
  .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`,
  [user.name, user.email, user.password])
  .then((result) => {
    if (result.rows.length > 0) {
      console.log(result.rows[0]);
      return result.rows[0];
    } else {
      console.log('please try again');
      return null;
    }
  })
  .catch((err) => {
    console.log(err.message);
    return null;
  })
};
/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(`SELECT reservations.id, properties.title, properties.cost_per_night, reservations.start_date
            FROM reservations 
            JOIN properties ON properties.id = property_id 
            JOIN property_reviews ON property.rating = property_rating
            WHERE reservations.guest_id = $1
            GROUP BY guest_id 
            LIMIT $2`)
    .then((result) => {
      if (result.rows.length > 0) {
        console.log(result.rows[0]);
        return result.rows[0];
      } else {
        console.log('No current reservations');
        return null;
      }
    })
    .catch((err) => {
      console.error(err.message);
      return null;
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options) => {
  const queryParams = [];
  
  let queryString = `
  SELECT properties *, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id`

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length}`
  };

  if (options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    queryString +=`AND owner_id LIKE $${queryParams.length}`
  };

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(`%${options.minimum_price_per_night <= options.maximum_price_per_night}%`);
    queryString +=`AND minimum_price_per_night <= maximum_price_per_night LIKE $${queryParams.length}`
  };

  if (options.minimum_rating) {
    queryParams.push(`%${options.minimum_rating}%`);
    queryString +=`AND minimum_rating LIKE $${queryParams.length}`
    };

  queryParams.push(`$${limit}`);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length}`;

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams).then((res) => res.rows);
};


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  let queryString = `INSERT INTO properties (
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  )
  VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
  )
  RETURNING *)`

  const values = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ];

  return pool.query(queryString, values)
    .then(res => res.rows[0])
    .catch(err => console.error('query error', err.stack));

};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
