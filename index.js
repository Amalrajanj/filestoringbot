require('dotenv').config()
const { Telegraf, Markup } = require('telegraf')
const TelegrafStatelessQuestion = require('telegraf-stateless-question');
const bot = new Telegraf(process.env.TOKEN)

const db = require('./config/connecton')
const collection = require('./config/collection')
const adminHelper = require('./helper/adminHelper')


//DATABASE CONNECTION 
db.connect((err) => {
    if (err) { console.log('error connection db' + err); }
    else { console.log('db connected'); }
})

//member of a channel or not
let joinedState = false

//start message 

bot.start(async (ctx) => {
    let userId = ctx.message.from.id
    let first_name = ctx.message.from.first_name

    //checking if user is a member of channel or not 
   await bot.telegram.getChatMember(`@${process.env.CHANNEL_USERNAME}`, ctx.from.id).then((res) => {
        status = res.status
        console.log(status);
        if (status == 'left') {
            joinedState = false
            ctx.reply(`<b>You must join our channel to use this bot</b>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔰Join channel', url: `t.me/${process.env.CHANNEL_USERNAME}` }],
                        [{ text: '✅Joined', callback_data: 'JOINCHECK' }]
                    ]
                }
            })
        } else {
            joinedState = true
            ctx.reply('<b>Search for files uploaded by our team</b>', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔎Search',switch_inline_query:''}]
                    ]
                }

            })
        }
    })

    //to save userdata for broadcasting purpose

    userData = {
        userId: userId,
        first_name: first_name

    }
    adminHelper.saveUser(userData)

    //checking if admin and providing admin keyboard to manage requests,help etc
    if (ctx.from.id == process.env.ADMIN) {
        return await ctx.reply('❤Hello my Admin', Markup.keyboard(
            [
                ['🤖Bot statics','🔰Help'],
                ['❕Requests'],
                ['💌Broadcast user']
            ]
        )
            .oneTime()
            .resize()
        )
    }else{
        return await ctx.reply('HI',Markup.keyboard(
            [
                ['📖Help','♻Share'],
                ['📥Request'],
                ['🧾List']
            ]
        )
        .oneTime()
        .resize()
        )
        
    }
})


//==============================================================================================================//

//defining admin buttons


bot.hears('🤖Bot statics', async (ctx) => {
    let users = await adminHelper.getUser().then((res) => {
        if (ctx.from.id == process.env.ADMIN) {
            ctx.reply(`📊<b>Total users started bot</b>:${res.length}\n\n⚠<i>Real time data only available while broadcasting message</i>`, { parse_mode: 'HTML' })
        } else {
            ctx.reply('not found read /help to know how to use the bot')
        }
    })
})
bot.hears('🔰Help', (ctx) => {
    ctx.deleteMessage()
    if (ctx.from.id == process.env.ADMIN) {
        ctx.reply('we will soon add tutorials and documentations check @filestoringbot')
    }
})
bot.hears('❕Requests', async (ctx) => {
    ctx.deleteMessage()
    if (ctx.from.id == process.env.ADMIN) {
        let req = await adminHelper.getRequest().then((res) => {
            console.log(res);
            let reqArray = [];
            for (i = 0; i < res.length; i++) {
                reqArray.push(res[i].inputQuery)
            }
            console.log(reqArray);
            let requestedContent = reqArray.map((item, index) => {
                return `<code>${item}</code>`
            })
            let reqData = requestedContent.join('\n\n')
            if (ctx.from.id == process.env.ADMIN) {
                ctx.reply(`${reqData}`, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Delete a request', callback_data: 'REQONE' }],
                            [{ text: "Delete all Requests", callback_data: 'REQALL' }]
                        ]
                    }
                })
            }

        })
    }
})

//getting requested keyword to remove

const ReqQuestion = new TelegrafStatelessQuestion('request',async ctx => {
	console.log('user broadcasting')
	text =ctx.message.text
    if(text.length >0){
       await adminHelper.delRequest(text).then(async(res)=>{
           
            if (ctx.from.id == process.env.ADMIN) {
                return await ctx.reply('✅Removed succesfully ', Markup.keyboard(
                    [
                        ['🤖Bot statics','🔰Help'],
                        ['❕Requests'],
                        ['💌Broadcast user']
                    ]
                )
                    .oneTime()
                    .resize()
                )
            }
            
        })
    }else{
        ctx.reply('🚫Enter a valid text')
    }
        
})
bot.use(ReqQuestion.middleware())

bot.action('REQONE',async(ctx)=>{
    text = '⚠ Copy paste the exact keyword from request list to remove from list'
    return ReqQuestion.replyWithMarkdown(ctx,text)
})

//getting broadcast message

const broadCastQuestion = new TelegrafStatelessQuestion('broadcastuser',async ctx => {
	console.log('user broadcasting')
	text =ctx.message.text
	
	if(ctx.message.text.length >0){
        let userData = await adminHelper.getUser().then(async(res) => {

            let userId = []
            n = res.length
            for (i = 0; i < n; i++) {
                userId.push(res[i].userId)
            }
            //broadcasting message and getting number of sucesfull broadcast
            failedCount = []
            async function broadcast(text) {
                for (users of userId) {
                    try {
                        await bot.telegram.sendMessage(users, String(text))
                    } catch (error) {
                        failedCount.push(users)
                    }
                }
               // ctx.reply(`📊Total users started bot: <b>${n}</b>\n🛑failed users -<b>${failedCount.length}</b>\n🎉Active users:<b>${n - failedCount.length}</b>`, { parse_mode: 'HTML' })
                return await ctx.replyWithMarkdown(`📊Total users started bot: *${n}*\n🛑failed users -*${failedCount.length}*\n🎉Active users:*${n - failedCount.length}*`, Markup.keyboard(
                    [
                        ['🤖Bot statics','🔰Help'],
                        ['❕Requests'],
                        ['💌Broadcast user']
                    ]
                )
                    .oneTime()
                    .resize()
                )
            }
    
            if (ctx.from.id == process.env.ADMIN) {
                broadcast(text)
            } else {
                ctx.reply('you dont have the permission')
            }
    
        })
	}else{
		ctx.reply('‼ Enter a valid text')
	}
})

// Dont forget to use the middleware
bot.use(broadCastQuestion.middleware())

bot.hears('💌Broadcast user',(ctx)=>{
    let text = 'Enter message to be brodcasted(only text supported)'
    return broadCastQuestion.replyWithMarkdown(ctx,text)

})

//==============================================================================================================//

//defining user buttons 

bot.hears('📖Help',(ctx)=>{
    ctx.reply(`<b>🔍 NORMAL SEARCH</b>\n\n<i>Simply type your search keyword if its available bot will fetch files for you.Files may not have caption we will fix it soon</i>`,{
        parse_mode:'HTML',
        reply_markup:{
            inline_keyboard:[
                [{ text: "▶ Next", callback_data: 'helpNext'}],
                [{text:'🎲Clone',url:'t.me/filestoringbot'}]
            ]
        }
    })
})

bot.hears('♻Share',(ctx)=>{
    ctx.deleteMessage()
    ctx.reply(`❤ Hi <b>${ctx.from.first_name}</b> thanks for helping us.Click share button below and share our channel as a token of support`,{
        parse_mode:'HTML',
        reply_markup:{
            inline_keyboard:[
                [{text:'🧡SHARE',url:`https://t.me/share/url?url=https://t.me/${process.env.CHANNEL_USERNAME}`}]
            ]
        }
    })
})

const Req = new TelegrafStatelessQuestion('requesting',async ctx => {
	console.log('req')
    text =ctx.message.text
    reqData={
        inputQuery:text
    }
	
    if(ctx.message.via_bot){
        adminHelper.saveRequest(reqData)
        ctx.deleteMessage()
            return await ctx.reply(`🔖Saved to pending requests check our channel for updates`,Markup.keyboard(
                [
                    ['📖Help','♻Share'],
                    ['📥Request'],
                    ['🧾List']
                ]
            )
            .oneTime()
            .resize()
            )
    }else{
        ctx.deleteMessage()
        ctx.replyWithMarkdown(`❌Failed request try again\n use *@imdb* inline and enter query`)
    }
        
})
bot.use(Req.middleware())

bot.hears('📥Request',(ctx)=>{
    text = `🎉 use *@imdb* inline and enter query`
    return Req.replyWithMarkdown(ctx,text)
})

bot.hears('🧾List',(ctx)=>{
    saveData = adminHelper.getList().then((res) => {
        let n = res.length
        list = []
        for (i = 0; i < n; i++) {
            list.push(res[i].searchQuery)
        }
        let outputList = list.map((item, index) => {
            return `<code>${item}</code>`
        })
        let resultList = outputList.join('\n\n')
        ctx.reply(resultList, {
            parse_mode: 'HTML'
        })
    })
})


//broadcasting message

bot.command('send', async (ctx) => {
    msg = ctx.message.text
    let msgArray = msg.split(' ')
    msgArray.shift()
    let text = msgArray.join(' ')
    console.log(text);

    let userData = await adminHelper.getUser().then((res) => {

        let userId = []
        n = res.length
        for (i = 0; i < n; i++) {
            userId.push(res[i].userId)
        }
        //broadcasting message and getting number of sucesfull broadcast
        failedCount = []
        async function broadcast(text) {
            for (users of userId) {
                try {
                    await bot.telegram.sendMessage(users, String(text))
                } catch (error) {
                    failedCount.push(users)
                }
            }
            ctx.reply(`📊Total users started bot: <b>${n}</b>\n🛑failed users -<b>${failedCount.length}</b>\n🎉Active users:<b>${n - failedCount.length}</b>`, { parse_mode: 'HTML' })
        }

        if (ctx.from.id == process.env.ADMIN) {
            broadcast(text)
        } else {
            ctx.reply('you dont have the permission')
        }

    })
})

//getting file_id on sending document to bot

bot.on('document', (ctx) => {
    document = ctx.message.document
    file_id = document.file_id
    fileDetails ={
        file_name:document.file_name,
        file_id:document.file_id,
        caption:ctx.message.caption,
        file_size:document.file_size,
        uniqueId:document.file_unique_id
    }

    if (ctx.from.id == process.env.ADMIN) {
        ctx.reply(file_id)
        adminHelper.saveFileInline(fileDetails)
    } else {
        ctx.reply('🚫better send files to your personal chat')
    }


})

bot.on('audio',(ctx)=>{
    console.log(ctx.message.audio);
    audio = ctx.message.audio
    fileDetails ={
        file_name:audio.file_name,
        file_id:audio.file_id,
        caption:ctx.message.caption,
        file_size:audio.file_size,
        uniqueId:audio.file_unique_id
    }

    if (ctx.from.id == process.env.ADMIN) {
        ctx.reply(audio.file_id)
        adminHelper.saveFileInline(fileDetails)
    } else {
        ctx.reply('🚫better send files to your personal chat')
    }
})

//saving file_id with search query to database -input format  /save file name,file_id1,file_id2

bot.command('save', (ctx) => {
    inputMessage = ctx.message.text
    let inputMsgArray = inputMessage.split(' ')
    inputMsgArray.shift()
    let newInputMsgArray = inputMsgArray.join(' ')
    let message = newInputMsgArray.split(',')
    searchQuery = message[0].toLowerCase()
    message.shift()
    fileData = {
        searchQuery: searchQuery,
        file_id: message
    }

    if (ctx.from.id == process.env.ADMIN) {
        adminHelper.saveFile(fileData)
        ctx.reply('✅saved')
    } else {
        ctx.reply('not authorized')
    }

})

//delete content 

bot.command('del',(ctx)=>{
    msg = ctx.message.text
    let msgArray = msg.split(' ')
    msgArray.shift()
    let query = msgArray.join(' ')
    query.toLowerCase()
    console.log(query);
    if(ctx.from.id == process.env.ADMIN){
        adminHelper.deleteFile(query)
            ctx.reply('⭕removed')
    }
})

//update content

bot.command('update', async (ctx) => {
    inputMessage = ctx.message.text
    let inputMsgArray = inputMessage.split(' ')
    inputMsgArray.shift()
    let newInputMsgArray = inputMsgArray.join(' ')
    let message = newInputMsgArray.split(',')
    searchQuery = message[0].toLowerCase()
    message.shift()
    updateData = {
        searchQuery: searchQuery,
        file_id: message
    }
    if (ctx.from.id == process.env.ADMIN) {
        let update = await adminHelper.updateFile(updateData).then((res) => {
            if (res.result.nModified == 0) {
                ctx.reply('❌Nothing to upate')
            } else {
                ctx.reply('✅Updated')
            }
        })
    } else {
        ctx.reply('you are not authorized')
    }
})

//getting list of all added contents

bot.command('list', async (ctx) => {
    saveData = adminHelper.getList().then((res) => {
        let n = res.length
        list = []
        for (i = 0; i < n; i++) {
            list.push(res[i].searchQuery)
        }
        let outputList = list.map((item, index) => {
            return `<code>${item}</code>`
        })
        let resultList = outputList.join('\n\n')
        ctx.reply(resultList, {
            parse_mode: 'HTML'
        })
    })
})

//help 

bot.command('help', (ctx) => {
    ctx.reply(`<b>🔍NORMAL SEARCH</b>\n\n<b>Simply type your search keyword if its available bot will fetch files for you.Files may not have caption we will fix it soon</b>`,{
        parse_mode:'HTML',
        reply_markup:{
            inline_keyboard:[
                [{ text: "▶ Next", callback_data: 'helpNext'}],
                [{text:'🎲Clone',url:'t.me/filestoringbot'}]
            ]
        }
    })
})




//checking search query and taking file_id from database and sending document with file_id

bot.on('message', async (ctx) => {
    inputQuery = ctx.message.text
    query = inputQuery.toLowerCase()
    
    console.log(inputQuery);
    let requestData = {
        inputQuery: query,
        first_name: ctx.from.first_name,
        from: ctx.from.id
    }
    
    let file =await adminHelper.getFile(query).then((res) => {
        if (res) {
            let n = res.file_id.length
            if (n > 0) {
                for (i = 0; i < n; i++) {
                    ctx.replyWithDocument(res.file_id[i])

                }
            } else {
                //error message if searched data not available saving search query to requested list
                ctx.reply(`❌Looks like the requested content is not available right now.<b>I have notified admins</b>`, { parse_mode: 'HTML' })
                bot.telegram.sendMessage(process.env.LOG_GROUP, `🛑Failed search\n<b>Keyword:</b><code>${query}</code>\n<b>First name:</b><code>${ctx.from.first_name}</code>\n<b>UserId:</b><code>${ctx.from.id}</code>`, { parse_mode: 'HTML' })
                

            }
        } else {
            ctx.reply(`❌Looks like the requested content is not available right now.<b>I have notified admins</b>`, { parse_mode: 'HTML' })
            bot.telegram.sendMessage(process.env.LOG_GROUP, `🛑Failed search\n<b>Keyword:</b><code>${query}</code>\n<b>First name:</b><code>${ctx.from.first_name}</code>\n<b>UserId:</b><code>${ctx.from.id}</code>`, { parse_mode: 'HTML' })

            
        }
    })
    
    bot.telegram.sendMessage(process.env.LOG_GROUP, `<b>Keyword:</b><code>${query}</code>\n<b>First name:</b><code>${ctx.from.first_name}</code>\n<b>UserId:</b><code>${ctx.from.id}</code>`, { parse_mode: 'HTML' })



})

//inline search

bot.on('inline_query',async(ctx)=>{
    query = ctx.inlineQuery.query
    if(query.length>0){
        let searchResult = adminHelper.getfileInline(query).then((res)=>{
            let result = res.map((item,index)=>{
                fileSize = item.file_size * 9.5367E-07
                return {
                    type:'document',
                    id:item._id,
                    title:item.file_name,
                    description:`size:${fileSize}MiB`,
                    document_file_id:item.file_id,
                    caption:item.caption,
                    reply_markup:{
                        inline_keyboard:[
                            [{text:"🔎Search again",switch_inline_query:''}]
                        ]
                    }
                }
            })
           
            ctx.answerInlineQuery(result)
        })
    }else{
        console.log('query not found');
    }
    
})

//==============================================================================================================//
//==============================================================================================================//

//callback datas 

bot.action('JOINCHECK', async (ctx) => {
    ctx.deleteMessage()
    await bot.telegram.getChatMember(`@${process.env.CHANNEL_USERNAME}`, ctx.from.id).then((res) => {
        status = res.status
        if (status != 'left') {
            joinedState = true
            ctx.reply('<b>Search for files uploaded by our team</b>', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '❤Share our channel', url: `https://t.me/share/url?url=https://t.me/${process.env.CHANNEL_USERNAME}` }]
                    ]
                }

            })

        } else {
            joinedState = false
            ctx.reply(`<b>You must join our channel to use this bot</b>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔰Join channel', url: `t.me/${process.env.CHANNEL_USERNAME}` }],
                        [{ text: '✅Joined', callback_data: 'JOINCHECK' }]
                    ]
                }
            })
        }
    })

})

bot.action('helpNext', (ctx) => {
    ctx.deleteMessage()
    ctx.reply('<b>🔰INLINE SEARCH</b>\n\n<i>Click 🔎Search button and use me inline in your personal chat.Files will be having caption and efficient search result</i>', {
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [{ text: "◀ Back", callback_data: 'helpBack' }],
                [{ text: '🔎Search', switch_inline_query: "" }]
            ]
        }

    })
})
bot.action('helpBack', (ctx) => {
    ctx.deleteMessage()
    ctx.reply(`<b>🔍NORMAL SEARCH</b>\n\n<i>Simply type your search keyword if its available bot will fetch files for you.Files may not have caption we will fix it soon</i>`,{
        parse_mode:'HTML',
        reply_markup:{
            inline_keyboard:[
                [{ text: "▶ Next", callback_data: 'helpNext'}],
                [{text:'🎲Clone',url:'t.me/filestoringbot'}]
            ]
        }
    })
})

bot.action('REQALL', async (ctx) => {
    ctx.deleteMessage()
    await db.get().collection(collection.REQUEST).drop()
})


// deploy to heroku 

domain = `${process.env.DOMAIN}.herokuapp.com`
bot.launch({
    webhook:{
       domain:domain,
        port:Number(process.env.PORT)

    }
})


