require('dotenv').config()
const {Telegraf} = require('telegraf')
const bot = new Telegraf(process.env.TOKEN)

const db = require('./config/connecton')
const collection = require('./config/collection')
const adminHelper = require('./helper/adminHelper')

//DATABASE CONNECTION 
db.connect((err)=>{
    if(err){console.log('error connection db'+err);}
    else{console.log('db connected');}
})

//start message 

bot.start((ctx)=>{
    let userId = ctx.message.from.id
    let first_name = ctx.message.from.first_name
    ctx.reply('<b>Search for files uploaded by our team</b>',{
        parse_mode:'HTML',
        reply_markup:{
            inline_keyboard:[
                [{text:'🔰join channel🔰',url:`t.me/${process.env.CHANNEL_USERNAME}`}]
            ]
        }

    })
    //to save userdata for broadcasting purpose

    userData = {
        userId:userId,
        first_name:first_name

    }
   adminHelper.saveUser(userData)
})

//getting number of users started bot

bot.command('stats',async(ctx)=>{
    let users = await adminHelper.getUser().then((res)=>{
        if(ctx.from.id == process.env.ADMIN){
            ctx.reply(`📊<b>Total users started bot</b>:${res.length}`,{parse_mode:'HTML'})
        }else{
            ctx.reply('not found read /help to know how to use the bot')
        }
    })
})

//broadcasting message

bot.command('send',async(ctx)=>{
    msg = ctx.message.text
    let msgArray= msg.split(' ')
     msgArray.shift()
     let text = msgArray.join(' ') 
     console.log(text);
 
     let userData = await adminHelper.getUser().then((res)=>{
         
         let userId = []
         n = res.length
         for(i=0;i<n;i++){
             userId.push(res[i].userId)
         }
         //broadcasting message and getting number of sucesfull broadcast
         failedCount = []
         async function broadcast(text){
            for(users of userId){
                try{
                    await bot.telegram.sendMessage(users,String(text))
                }catch(error){
                    failedCount.push(users)
                }
            }
            ctx.reply(`📊Total users started bot: <b>${n}</b>\n🛑failed users -<b>${failedCount.length}</b>\n🎉Active users:<b>${n-failedCount.length}</b>`,{parse_mode:'HTML'})
         }

         if(ctx.from.id ==process.env.ADMIN){
            broadcast(text)
         }else{
             ctx.reply('you dont have the permission')
         }
            
     })
})

//getting file_id on sending document to bot

bot.on('document',(ctx)=>{
    caption = ctx.message.caption //will use in next update to provide file with caption
    document = ctx.message.document
    file_id = document.file_id 
    file_name = document.file_name //will use for indexing in next update if possible

    if(ctx.from.id == process.env.ADMIN){
        ctx.reply(file_id)
    }else{
        ctx.reply('better send files to your personal chat')
    }
})

//saving file_id with search query to database -input format  /save file name,file_id1,file_id2

bot.command('save',(ctx)=>{
    inputMessage = ctx.message.text
    let inputMsgArray = inputMessage.split(' ')
    inputMsgArray.shift()
    let newInputMsgArray = inputMsgArray.join(' ')
    let message = newInputMsgArray.split(',')
    searchQuery = message[0].toLowerCase()
    message.shift()
    fileData = {
        searchQuery:searchQuery,
        file_id:message
    }

    if(ctx.from.id == process.env.ADMIN){
        adminHelper.saveFile(fileData)
        ctx.reply('✅saved')
    }else{
        ctx.reply('not authorized')
    }

})

//update content

bot.command('update',async(ctx)=>{
    inputMessage = ctx.message.text
    let inputMsgArray = inputMessage.split(' ')
    inputMsgArray.shift()
    let newInputMsgArray = inputMsgArray.join(' ')
    let message = newInputMsgArray.split(',')
    searchQuery = message[0].toLowerCase()
    message.shift()
    updateData={
        searchQuery:searchQuery,
        file_id:message
    }
    if(ctx.from.id==process.env.ADMIN){
        let update = await adminHelper.updateFile(updateData).then((res)=>{
            if(res.result.nModified==0){
                ctx.reply('❌Nothing to upate')
            }else{
                ctx.reply('✅Updated')
            }
        })
    }else{
        ctx.reply('you are not authorized')
    }
})

//getting list of all added contents

bot.command('list',async(ctx)=>{
    saveData = adminHelper.getList().then((res)=>{
        let n = res.length
        list = []
        for(i=0;i<n;i++){
            list.push(res[i].searchQuery)
        }
        let outputList = list.map((item,index)=>{
            return `<code>${item}</code>`
        })
        let resultList=outputList.join('\n\n')
        ctx.reply(resultList,{
            parse_mode:'HTML'
        })
    })
})

//delete a collection

bot.command('del',async(ctx)=>{
    inputMessage = ctx.message.text
    let inputMsgArray = inputMessage.split(' ')
    inputMsgArray.shift()
    let searchQuery = inputMsgArray.join(' ')
    let del = await adminHelper.deleteFile(searchQuery).then((res)=>{
        if(res.deletedCount>0){
            ctx.reply('<b>✅removed</b>',{
                parse_mode:'HTML'
            })
        }else{
            ctx.reply('<b>❌Nothing to delete</b>',{
                parse_mode:'HTML'
            })
        }
    })
})

//help 

bot.command('help',(ctx)=>{
    if(ctx.from.id == process.env.ADMIN){
        ctx.reply('🔎<b>Simply type your movie/series name</b>(make sure the spelling is same as imdb)\n\nCheck /list for available contents',{
            parse_mode:"HTML",
            reply_markup:{
                inline_keyboard:[
                    [{text:"▶ Next",callback_data:'helpNext'}],
                    [{text:"📊Statitics",callback_data:"helpStatitics"}],
                    [{text:'🔰Admin helper',url:'https://telegra.ph/Filestoringbot-03-01'}]
                ]
            }
    
        })
    }else{
        ctx.reply('🔎<b>Simply type your movie/series name</b>(make sure the spelling is same as imdb)\n\nCheck /list for available contents',{
            parse_mode:"HTML",
            reply_markup:{
                inline_keyboard:[
                    [{text:"▶ Next",callback_data:'helpNext'}],
                    [{text:"📊Statitics",callback_data:"helpStatitics"},{text:"🎲Clone",callback_data:'helpClone'}]
                ]
            }
    
        })
    }
})

//checking search query and taking file_id from database and sending document with file_id

bot.on('message',async(ctx)=>{
    inputQuery = ctx.message.text 
    let searchData = {
        inputQuery:inputQuery,
        from:ctx.from.id
    }

    //Creating function to notify on fullfilling request
    let fullFill=(searchData)=>{
        bot.telegram.sendMessage(process.env.LOG_GROUP,`❌Failed request: <code>${inputQuery}</code>\nFirst Name:${ctx.from.first_name}\nuserID:<code>${ctx.from.id}</code>`,{
            parse_mode:'HTML',
            reply_markup:{
                inline_keyboard:[
                    [{text:"✅Request fullfilled",callback_data:'REQUESTFULLFILLED'}]
                ]
            }
        })
    }
    query = inputQuery.toLowerCase()
    let file = await adminHelper.getFile(query).then((res)=>{
        if(res){
            let n = res.file_id.length
        if(n>0){
            for(i=0;i<n;i++){
                ctx.replyWithDocument(res.file_id[i])
            }
        }else{
            //error message if searched data not available and adding it to log group or channel
            ctx.reply(`❌Looks like the requested content is not available right now.<b>I have notified admins</b>`,{parse_mode:'HTML'})
            if(process.env.LOG_GROUP){
                fullFill(searchData)
            }
        }
        }else{
            ctx.reply(`❌Looks like the requested content is not available right now.<b>I have notified admins</b>`,{parse_mode:'HTML'})
            if(process.env.LOG_GROUP){
                fullFill(searchData)
            }
        }
    })

    //defining callback to send notification on fullfilling user request
    bot.action('REQUESTFULLFILLED',(ctx)=>{
        fullfilled=(searchData)=>{
            bot.telegram.sendMessage(searchData.from,`❤We always care user interests and we have noticed you were searching for <b>${searchData.inputQuery}</b>.\n\nWe have succesfully uploaded your request try searching  <code>${searchData.inputQuery}</code>`,{
                parse_mode:'HTML'
            })
        }
        fullfilled(searchData)
        
    })

})

//callback datas 

bot.action('helpNext',(ctx)=>{
    ctx.deleteMessage()
    ctx.reply('👁‍🗨 We are trying to provide contents for free.Sometimes we run out of fund for maintaining channel you can consider donating\n\n\n 🔰<b>If you are a channel admin free feel to promote us and feel free to take our contents</b>',{
        parse_mode:"HTML",
        reply_markup:{
            inline_keyboard:[
                [{text:"◀ Back",callback_data:'helpBack'}],
                [{text:"📊Statitics",callback_data:"helpStatitics"},{text:"🎲Clone",callback_data:'helpClone'}]
            ]
        }

    })
})
bot.action('helpBack',(ctx)=>{
    ctx.deleteMessage()
    ctx.reply('🔎<b>Simply type your movie/series name</b>(make sure the spelling is same as imdb)\n\nCheck /list for available contents',{
        parse_mode:"HTML",
        reply_markup:{
            inline_keyboard:[
                [{text:"▶ Next",callback_data:'helpNext'}],
                [{text:"📊Statitics",callback_data:"helpStatitics"},{text:"🎲Clone",callback_data:'helpClone'}]
            ]
        }

    })
})

bot.action('helpClone',(ctx)=>{
    ctx.deleteMessage()
    ctx.reply('bot is not pretty as it seems from outside ,you have to manually add files for now, we will update code soon if you still think you need your own version of this bot im happy to help set up one for you(its free for now)\ncontact @Reportnetflixbot',{
        parse_mode:"HTML",
        reply_markup:{
            inline_keyboard:[
                [{text:'Back',callback_data:'helpBack'}]
            ]
        }
    })
})

bot.action('helpStatitics',(ctx)=>{
    ctx.deleteMessage()
    ctx.reply('you are not authorized to view statistics,soon we will make it public',{
        parse_mode:"HTML",
        reply_markup:{
            inline_keyboard:[
                [{text:'Back',callback_data:'helpBack'}]
            ]
        }
    })
})

bot.action('adminHelp',(ctx)=>{
    ctx.deleteMessage()
    ctx.reply(`i,`,{
        parse_mode:'HTML',
        reply_markup:{
            inline_keyboard:[
                [{text:'◀Back',callback_data:'adminHelpMenu'}]
            ]
        }

    })
})
bot.action('adminHelpMenu',(ctx)=>{
    ctx.deleteMessage()
    ctx.reply('🔎<b>Simply type your movie/series name</b>(make sure the spelling is same as imdb)\n\nCheck /list for available contents',{
        parse_mode:"HTML",
        reply_markup:{
            inline_keyboard:[
                [{text:"▶ Next",callback_data:'helpNext'}],
                [{text:"📊Statitics",callback_data:"helpStatitics"}],
                [{text:'🔰Admin helper',callback_data:'adminHelp'}]
            ]
        }

    })
})

// domain = `${process.env.DOMAIN}.herokuapp.com`
// bot.launch({
//     webhook:{
//        domain:domain,
//         port:Number(process.env.PORT)

//     }
// })

bot.launch()