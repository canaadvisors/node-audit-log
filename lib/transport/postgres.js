var pg = require('pg');
var util = require('util');

/* PostgresTransport
 *
 * A Postgres storage handler for Audit-Log for Node.js
 *
 */
PostgresTransport = function(options) {
    this.name = 'postgres';

    this._options = { tableName:'audit_log', connectionString:'', debug: false };
    this._connection;

    // override default options with the provided values
    if(typeof options !== 'undefined') {
        for(var attr in options) {
            this._options[attr] = options[attr];
        }
    }

    // verify if tables exists
    this.checkDbExistance(function(err,result){
        if(err)return cb(err);
        if(!result)this.init(function(err,creationResult){
            if(err)return console.log(err);
            console.log(creationResult);
        })
    });

    this.modelSchema = new Schema({
        actor: {type:String},
        date: {type:Date},
        origin: {type:String},
        action: {type:String},
        label: {type:String},
        object: {type:String},
        description: {type:String}
    });

    this.emit = function( dataObject ) {
        this.debugMessage('emit: '+util.inspect(dataObject));

        if(dataObject.logType && dataObject.logType == 'Event') {
            var newEvent = new this.model( dataObject );
            newEvent.save(function(err) {
                if(err) this.debugMessage('error saving event to database: '+err);
            });
        }
    }

    this.checkDbExistance = function checkDbExistance (cb){
        pg.connect(connString,function(err,client,done){
            if(err)return console.error(err.message);
            client.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ($1))",[this._options.tableName],function(err,result){
                done();return cb(null,result.rows[0].exists);//verify if db returs true/false for the table lookup
                if(err)return cb(err);
            });
        });
    }

    this.debugMessage = function(msg) { if(this._options.debug) console.log('Audit-Log(mongoose): '+msg); }

    this.init = function init (cb){
        async.series([
            initCreate,
            initIndexation
        ], function(err, results) {
            if (err) {
                console.log(err);
                cb(err);
            }
            else {
                console.log(results);
                cb(null, results);
            }
        });
    }

    return this;
}

function initCreate(cb){
    execQuery('CREATE TABLE IF NOT EXISTS audit_log (actor VARCHAR(255), date TIMESTAMP WITHOUT TIME ZONE NOT NULL, origin VARCHAR(255) NULL), action VARCHAR(255) NULL), label VARCHAR(255) NULL), object VARCHAR(255) NULL), description VARCHAR(255) NULL)');
    cb(null,'tables created');
}

function initIndexation(cb){
    execQuery('CREATE INDEX IDX_audit_log_1 ON organization_unit(actor,date)');
}

exports = module.exports = PostgresTransport;