/**
 * A flag array, transfered from the server as an int, treated in stackage-js as an array of ints of 2^n
 */
import DataType from "stackage-js/data-types/data-type";

class Flag extends Array {
    /**
     * Turns an int representation of a byte array into an array of ints representative of its parts  
     * @param {int} value representation of a byte array
     * @returns {[int]} array of individual flag values
     */
    static toArray = (value) => {
        const bits = (value || 0).toString(2);
        return [...bits].reverse().map((x, i) => {
            if (x === '1'){
                return 2**i;
            }
        }).filter(Boolean);
    }
    /**
     * Turns an array of integers into a single integer representation of a byte array
     * @param {[int]} value where int is a power of 2
     * @returns 
     */
    static toInt = (value) => {
        return value.reduce((a, b) => a + (b | 0), 0);
    }

    /**
     * Turns array of values into their human-readable counterparts in a joined string
     * @param {[int]} value 
     * @param {[Enum]} options 
     * @returns human readable string
     */
    static toReadable = (value, options) => {
        let build = [...value].map(x => options[x]);
        if (build.length > 1){
            build[build.length - 1] = `and ${build[build.length-1]}`;
        }
        return build.join(build.length > 2 ? ', ' : ' ');
    }

    constructor(value, config) {
        super();
        let _value = Flag.toArray(value);

        Object.defineProperty(this, '_raw', {
            enumerable: false,
            configurable: false,
            get: () => {
                //turn back into int
                return Flag.toInt(_value);
            },
            set: (int) => {
                _value = Flag.toArray(int);
            }
        });

        Object.defineProperty(this, '_value', {
            enumerable: false,
            configurable: false,
            get: () => {
                return _value;
            }, 
            set: (array) => {
                _value = array;
            }
        });

        Object.defineProperty(this, '_validate', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: () => {
                const errors = [];
                _value.forEach(x => {
                    if (x.toString(2).indexOf('1',1) !== -1){
                        errors.push({
                            type: 'format',
                            message: `${x} is not a valid flag value.`
                        });
                    }
                });
                return errors;
            }
        });

        return this;
    }

    static baseType = DataType;
}


export default Flag;