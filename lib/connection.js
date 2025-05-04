import Model from "./data-types/model";

// Stores the connections used for a given application. 
// Without specification, the default record will be used, which is 
// just fine if you only have one back-end to connect to. The application
// prefix defined in your models should be used to identify which connection
// to use in multi-source API system. 

const connections = {};

const addConnection = (url, id = "default") => {
    connections[id] = {
        urlBase: url, 
    }
}
// TODO treat localStorage like a connection, with 
// extra maintenance methods to store/retrieve/relocate as needed

// TODO We need to be able to handle auth here... 
// with a refresh then retry being configurable. 
// And if the connection in question is being refreshed
// We should queue up fetches instead of bombarding it with 
// calls we know will fail


const GetConnectionForModel = (model) => {
    const connection = connections[model.prefix || 'default'];
    if (!connection) return //TODO errror;
    return connection;
}

const Connection = {};

/**
 * Get record by id for model
 * @param model
 * @param id
 * @return {Promise}
 */
Connection.get = function(model, id) {
    const connection = GetConnectionForModel(model);
    return fetch({
        method: 'get', 
        url: `${connection.urlBase}/${model.pathname}/${id}`,
    });
}

/**
 * Get records by ids for model
 * @param model
 * @param ids
 * @return {Promise}
 */
Connection.list = function(model, ids){
    const connection = GetConnectionForModel(model);
    return fetch({
        method: 'get',
        url: `${connection.urlBase}/${model.pathname}/list/${ids.join(',')}`,
    });
}

/**
 * Get all records for model
 * @param model
 * @return {Promise}
 */
Connection.all = function(model){
    const connection = GetConnectionForModel(model);
    return fetch({
        method: 'get',
        url: `${connection.urlBase}/${model.pathname}/all`,
    });
}

/**
 * Get all ids for model
 * @param model
 * @return {Promise}
 */
Connection.allIds = function(model){
    const connection = GetConnectionForModel(model);
    return fetch({
        method: 'get',
        url: `${connection.urlBase}/${model.pathname}/all-ids`,
    });
}

/**
 * Save record output on model
 * @param model
 * @param data
 * @return {Promise}
 */
Connection.save = function(model, data){
    const connection = GetConnectionForModel(model);
    return fetch({
        method: 'post',
        url: `${connection.urlBase}/${model.pathname}/save`,
        body: data
    })
}

/**
 * Save records output on model
 * @param model
 * @param data
 * @return {Promise}
 */
Connection.saveMany = function(model, data){
    const connection = GetConnectionForModel(model);
    return fetch({
        method: 'post',
        url: `${connection.urlBase}/${model.pathname}/save-many`,
        body: data,
    })
}

/**
 * Delete record by id on model
 * @param model
 * @param id
 * @return {Promise}
 */
Connection.delete = function(model, id){
    const connection = GetConnectionForModel(model);
    return fetch({
        method: 'post',
        url: `${connection.urlBase}/${model.pathname}/delete`,
        body: id,
    })
}

/**
 * Delete records by ids on model
 * @param model
 * @param ids
 * @return {Promise}
 */
Connection.deleteMany = function(model, ids){
    const connection = GetConnectionForModel(model);
    return fetch({
        method: 'post',
        url: `${connection.urlBase}/${model.pathname}/delete-many`,
        body: ids,
    })
}

Connection.addConnection = addConnection;

export default Connection;