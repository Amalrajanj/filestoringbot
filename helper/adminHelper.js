const db = require('../config/connecton')
const collection = require('../config/collection')
var objectId = require('mongodb').ObjectID

module.exports={
    //saving user id for broadcasting
    saveUser:(userData)=>{
        db.get().collection(collection.USER_INFO).createIndex({"userId":1},{unique:true,dropDups: true})
        db.get().collection(collection.USER_INFO).insertOne(userData).catch((err)=>{
            
        })
    },
    getUser:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_INFO).find({}).toArray().then((res)=>{
                resolve(res)
            })
        })
    },
    saveFile:(fileData)=>{
        db.get().collection(collection.FILE_COLLECTION).insertOne(fileData).then((res)=>{
            console.log(res);
        })
    },
    getFile:(query)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.FILE_COLLECTION).findOne({searchQuery:query}).then((res)=>{
                resolve(res)
            })
        })
    },
    updateFile:(updateData)=>{
       return new Promise((resolve,reject)=>{
        db.get().collection(collection.FILE_COLLECTION).updateOne({searchQuery:updateData.searchQuery},{$push:{file_id:{$each:updateData.file_id}}}).then((res)=>{
            resolve(res)
        })
       })
    },
    getList:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.FILE_COLLECTION).find({}).toArray().then((res)=>{
                resolve(res)
            })
        })
    },
    deleteFile:(searchQuery)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.FILE_COLLECTION).deleteOne({searchQuery:searchQuery}).then((res)=>{
                resolve(res)
            })
        })
    },
    //trying to save failed search as request
    saveRequest:(requestData)=>{
        db.get().collection(collection.REQUEST).createIndex({"inputQuery":1},{unique:true,dropDups:true})
        db.get().collection(collection.REQUEST).insertOne(requestData).then((res)=>{
            console.log(res);
        })
    },
    getRequest:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.REQUEST).find({}).toArray().then((res)=>{
                resolve(res)
            })
        })
    },
    delRequest:(query)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.REQUEST).deleteOne({inputQuery:query}).then((res)=>{
                resolve(res)
            })
        })
    },

    //saving files automatically for inline search
    saveFileInline:(fileDetails)=>{
        db.get().collection(collection.INLINE_FILE).createIndex({file_name:"text"})
        db.get().collection(collection.INLINE_FILE).insertOne(fileDetails).then((res)=>{
            console.log(res);
        })
    },
    getfileInline:(query)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.INLINE_FILE).find( { file_name: { $regex:query ,$options:'i'} } ).toArray().then((res)=>{
                console.log(res);
                resolve(res)
            }) 
           })
    }
}