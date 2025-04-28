import Model from "stackage-js/data-types/model";
import Connection from "./connection";

/**
 * Adds a 'table' to the 'database'
 * Called from Database proxy property getter
 * @param {Model} model - raw Model class of desired type
 */
function addTableToDatabase(model) {

    //unproxied table holder
    const _table = {};
    
    //track which id type we're using (Number, Guid)
    const idType = model.properties.id.type;

    //track how many records have been loaded
    const trackLoaded = { value: 0 };
    
    //Collection of all active promises for this table
    const _promiseBuffer = [];
    const _keys = [];
    const _array = [];



    /** TABLE PROPERTIES **/

    /**
     * Defines _keys property, a read-only const array of the known keys of this table.
     * Behind proxy
     */
    Object.defineProperty(_table, '_keys', {
        enumerable: false,
        writable: false,
        value: _keys,
    });

    /** 
     * Defines _array property, a read-only const array of the known records of this table
     * Behind proxy
     */
    Object.defineProperty(_table, '_array', {
        enumerable: false,
        writable: false,
        value: _array,
    });

    /** 
     * Defines _promises property, a read-only const array of the active promises on this table
     * Behind proxy
     */
    Object.defineProperty(_table, '_promises', {
        enumerable: false,
        writable: false,
        value: _promiseBuffer,
    });

    /** 
     * Defines _length property, a read-only count of all known records of this table 
     * Behind proxy
     */
    Object.defineProperty(_table, '_length', {
        enumerable: false,
        configurable: true,
        get: () => {
            return _keys.length;
        }
    });


    /** TABLE METHODS **/

    /**
     * Defines _discover method, asks for all available ids for this table from API 
     * @return {Promise}
     */
    Object.defineProperty(_table, '_discover', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: () => {
            const promise = Connection.AllIds(model).then((response) => {

                //try to add each model to the talbe, method handles existing data internally
                for (let i in response.data){
                    addRecordToTable(response.data[i]);
                }

                for (let i in keys){
                    //TODO GUID needs a conditional
                    if (response.data.indexOf(parseInt(tableKeys[i])) === -1){
                        removeRecordFromTable(response.data[i]);
                    }
                }

                //remove this promise from the buffer
                _promiseBuffer.splice(_promiseBuffer.indexOf(promise), 1);
                return response;

            });//TODO error handling

            _promiseBuffer.push(promise);
            return promise;
        }
    });




    /// BEGIN ADD/REMOVE RECORD(S) ///


    /**
     * Adds a 'record' to the 'table'
     * Behind proxy
     * @param id
     * @param data (optional) 
     * @returns local database table proxy
     */
    const addRecordToTable = (id, data) => {

        //if we have data, don't set up lazy loading, populate record now
        if (data){

            //Is this record already marked loaded? 
            let wasLoaded = _table[id] && _table[id]._loaded;

            //if record doesn't exist locally, set it up
            if (_keys.indexOf(id) === -1){
                _table[id] = new model();

                _keys.push(id);
                _array.push(_table[id]);
            }

            //populate it with data
            _table[id]._populate(data);
            
            //track it has been loaded
            if (wasLoaded === false){
                trackLoaded.value++;
            }

            return _database[model.name];
        }
        
        //if record already exists, return now
        if (_keys.indexOf(id) !== -1){
            return _database[model.name];
        }
        
        //sets up a lazy load for the next time this record is accessed
        Object.defineProperty(_table, id, {
            enumerable: true,
            configurable: true,
            get: () => {
                console.log("YAR", id);
                //unwrap this key
                delete _table[id]; 
                
                //set up empty model, with id set
                _table[id] = new model();
                _table[id].id = id;

                _table[id]._loader.then((response) => {
                    //track that a record has loaded
                    trackLoaded.value++;
                    return response;
                });//!! error handling? 
                
                //set the record to get fetched
                queueRecordRequests(id);

                //return the reference to this record
                return _table[id]; 
            }
        });

        _keys.push(id);

        //point to the record without looking at it
        const ind = _array.length;
        Object.defineProperty(_array, ind, {
            enumerable: true,
            configurable: true,
            get: () => {
                _array[ind] = _table[id];
                return _table[id];
            }, 
            set: () => {
            }
        });

        //don't want to return record because access triggers data pull
        return _database[model.name];

    };

    _table.test = addRecordToTable;

    /**
     * Removes record from local database table
     * @param {Id, Record} id Takes a record or a record id
     * @returns {boolean} returns success 
     */
     const removeRecordFromTable = (id) => {
        try {
            if(id.constructor === model){
                id = id.id;
            }

            //make _keys aware of record delete
            const keyIndex = _keys.indexOf(id);
            if (keyIndex !== -1) {
                _keys.splice(keyIndex, 1);
            }

            //make _array aware of record delete
            const arrayIndex = _array.indexOf(_table[id]);//TODO triggers API?
            if (arrayIndex !== -1){
                _array.splice(arrayIndex, 1);
            }

            //delete the record
            delete _table[id];

        } catch (e){
            console.warn(e);
            return false;
        }
        return true;
    };






    // We are buffering the call to a particlar table with a 50ms delay. TODO make this a config  
    let waiter = null;
    const requestBuffer = [];
    
    /**
     * Queues ID for fetching.
     * Behind proxy
     * @param id
     */
    const queueRecordRequests = (id) => {
        
        //already getting this one, or there was an error don't try automatically
        if (_table[id]._fetching || _table[id]._error){
            return;
        }
        
        clearTimeout(waiter);
        _table[id]._fetching = true;
        requestBuffer.push(id);
        waiter = setTimeout(fetchRecords, 50);
    }

    /**
     * Fetches lists of data for this table.
     * Behind proxy
     */
    const fetchRecords = () => {
        const runBuffer = [...requestBuffer];
        requestBuffer.length = 0;
        
        let promise = Connection.list(model, runBuffer).then((response) => {
            
            //set all the data we got back
            for (let i in response.data){

                //TODO reexamine how this would disappear between asking and receiving info
                if (_table[response.data[i].id]){
                    _table[response.data[i].id]._populate(response.data[i]);
                }
                runBuffer.splice(runBuffer.indexOf(response.data[i].id), 1);
            }
            
            //if we didn't get some back mark them with an error
            for (let i in runBuffer){
                console.warn(`Id ${runBuffer[i]} on ${model.name} was omitted from return.`);

                _table[runBuffer[i]]._errors._model = {
                    type: 'missing',
                    message: `Id ${runBuffer[i]} on ${model.name} was omitted from return.`
                };
            }
            _promiseBuffer.splice(_promiseBuffer.indexOf(promise), 1);

        }, (error) => {
            //mark all records in this buffer with error
            for (let i in runBuffer){
                _table[runBuffer[i]]._errors._model = {
                    type: 'request',
                    message: error
                };
            }
            console.log(error);//!TODO be smarter about error
        });
        _promiseBuffer.push(promise);
    }




    //Set up the proxy to the new table on the database
    _database[model.name] = new Proxy(_table, {
        get: (target, key) => {

            //any records or helper properties just get returned
            if (Object.hasOwnProperty.call(target, key)){
                return target[key];
            }

            //any new records need to have the correct type of id
            if (
                key.constructor === Symbol
                || idType === Number && (Number.isInteger(Number(key)) === false || Number(key) <= 0)
                || idType === Guid && !(Guid._validate(key))
            ) {
                //console.warn(`Asked for mistyped record id: ${key}`);
                return null;
            }

            //non-existent id gets a new model
            addRecordToTable(key);
            return target[key];
        }, 

        //readies the record - the data can only be fetched internally
        set: (target, key) => {
            if (idType === Number && (Number.isInteger(Number(key)) === false || Number(key) <= 0)){
                console.warn(`Tried to add mistyped record id: ${key}`);
                return false;
            }
            if (Object.hasOwnProperty.call(target, key) === false){
                addRecordToTable(key);
            }
            return true;
        }
    });
}


//unproxied database holder
const _database = {};

/**
 * Database instance proxy
 */
const Database = new Proxy(_database, {
    get: (target, key) => {
        
        //if it's already here just return it
        if(Object.hasOwnProperty.call(target, key)){
            return target[key];
        }
 
        //check if we have a symbol 
        const symbol = Symbol.for(key);
        if (symbol){
            const keyModel = window[symbol];
            if (Object.isPrototypeOf.call(Model, keyModel)){
                
                //add table if not exists
                if (Object.hasOwnProperty.call(target, keyModel.name) === false){
                    addTableToDatabase(keyModel);
                }
 
                return target[keyModel.name];
            }
        }
 
        console.warn(`Asked for non-model property from database: ${key}`);
        return null;
        
    } 
 });
 
 export default Database;