export function errorCheck(response) {
  if (!response.ok) {
    console.error(
      "Request failed: [" + response.status + "] " + response.statusText
    );
    console.log(response);
    if (
      response.hasOwnProperty("headers") &&
      !response.headers.get("content_type").startsWith("application/json")
    ) {
      return Promise.reject("[" + response.status + "] " + response.statusText);
    }
    if (typeof data !== "undefined") {
      return response
        .json()
        .then(data =>
          Promise.reject("[ElasticSearch] " + data.error.root_cause[0].reason)
        );
    } else {
      return Promise.reject(
        "[ElasticSearch] " + response.status + ": " + response.statusText
      );
    }
    //throw new Error("Request failed: " + request.statusText);
  }
  return Promise.resolve(response);
}

export function getProperty(obj, param) {
  if (param === undefined || param === null) {
    return undefined;
  }

  if (obj === undefined || obj === null) {
    throw new Error("Obj may not be NULL");
  }
  param = param + "";
  if (!obj.hasOwnProperty(param)) {
    let index = param.indexOf(".");
    if (index !== -1) {
      if (!obj.hasOwnProperty(param.substring(0, index))) {
        // console.log("Cannot load property");
        return undefined;
      }
      return getProperty(
        obj[param.substring(0, index)],
        param.substring(index + 1)
      );
    } else {
      //console.log("Cannot load property " + param);
      return undefined;
    }
  }
  if (param.endsWith("_id") && param !== "eval_id" && param !== "quality_id") {
    return Number(obj[param]);
  } else {
    return obj[param];
  }
}

const ELASTICSEARCH_SERVER = process.env.REACT_APP_URL_ELASTICSEARCH || "https://www.openml.org/es/";
const ELASTICSEARCH_VERSION_MAYOR = process.env.REACT_APP_ELASTICSEARCH_VERSION_MAYOR || 6

// general search
export function search(
  query,
  tag,
  type = "data",
  fields = ["data_id", "name"],
  sort = "date",
  order = "desc",
  filter = [],
  from = 0,
  size = 50
) {
  if (tag !== undefined) {
    //nested query for tag
    filter = [
      {
        nested: {
          path: "tags",
          query: {
            term: {
              "tags.tag": tag
            }
          }
        }
      }
    ];
  }
  let qterms = { match_all: {} };
  if (query !== undefined) {
    qterms = {
      query_string: {
        query: query
      }
    };
  }

  let params = {
    from: from,
    size: size,
    query: {
      bool: {
        must: qterms,
        filter: [].concat(filter),
        should: [
          {
            term: {
              visibility: "public"
            }
          }
        ],
        minimum_should_match: 1
      }
    },
    aggs: {
      type: {
        terms: { field: ELASTICSEARCH_VERSION_MAYOR >= 8 ? "_index" : "_type" }
      }
    },
    _source: fields.filter(l => !!l)
  };
  if (sort !== "match"){
    params["sort"] = {
      [sort]: {
        order: order
      }
    }
  }
  // uncomment for debugging the search
  //console.log("Search: " + JSON.stringify(params));
  //return fetch(process.env.REACT_APP_URL_ELASTICSEARCH + '/' + type + '/'+ type + '/_search?type=' + type,
  const search_url = ELASTICSEARCH_VERSION_MAYOR >= 8 ? type + "/_search" : type + "/" + type + "/_search?type=" + type
  return fetch(
    ELASTICSEARCH_SERVER + search_url,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST",
      mode: "cors",
      body: JSON.stringify(params)
    }
  )
    .then(errorCheck)
    .then(request => request.json())
    .then(data => {
      return {
        counts: ELASTICSEARCH_VERSION_MAYOR >= 8 ? data["hits"]["total"]["value"] : data["hits"]["total"],
        results: data["hits"]["hits"].map(x => {
          let source = x["_source"];
          let res = {};
          fields.forEach(field => {
            res[field] = getProperty(source, field);
          });
          return res;
        })
      };
    });
}

//get specific item
export function getItem(type, itemId) {
  const search_url = ELASTICSEARCH_VERSION_MAYOR >= 8 ? type + "/_doc/" + itemId : type + "/" + type + "/" + itemId
  return fetch(ELASTICSEARCH_SERVER + search_url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    mode: "cors"
  })
    .then(errorCheck)
    .then(request => request.json())
    .then(data => {
      if (data["found"] !== true) {
        throw Error(
          'No task with id "' +
            itemId +
            '" found. It may have been removed or renamed'
        );
      }
      return Promise.resolve(data["_source"]);
    });
}

// Not used?
export function getList(itemId) {
  return fetch(ELASTICSEARCH_SERVER + "data/data/list/tag/" + itemId, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    mode: "cors"
  })
    .then(errorCheck)
    .then(request => request.json())
    .then(data => {
      if (data["found"] !== true) {
        throw Error(
          'No task with id "' +
            itemId +
            '" found. It may have been removed or renamed'
        );
      }
      return Promise.resolve(data["_source"]);
    });
}
