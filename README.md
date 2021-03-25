# filestoringbot
stores files with file_id on telegram ( "This bot is only for storing and sending files and not for promoting violation of copyright")

<a href="https://heroku.com/deploy?template=https://github.com/Amalrajanj/filestoringbot">
  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>


required details 

<code>TOKEN</code> - Get bot token from bot father

<code>DOMAIN</code> - Same as app name that you enter in heroku

<code>ADMIN</code> - your account id(if you cant find it use bots like @getidsbot )

<code>CHANNEL_USERNAME</code> - your channel username without '@'

<code>DB_URL</code> - create an account on https://www.mongodb.com/cloud/atlas , database name - mediaFile ,collection name - fileBackup.Click connect and choose 'connect your application'.Copy the link and replace "< password >" with password of user having acess to db and replace "myFirstDatabase" to "mediaFile"
  
<code>GROUP_ID</code> - create a private group or channel to get users search and failed search ,so you can notify them after uploading content




we have added some tutorials on how to use t.me/filestoringbot

<h2>HOW TO USE?</h2
  
  ⚠ Let me warn you bot is bit old school you have to eveything manually
  
<h3>How to save file?</h3>
  
  1.send document to bot it will return a file_id
  
  2.copy file_id
  
  3.use the following format <code>/save file name,file_id</code>
  
  4.To add more than one files seperate multiple file_id with coma <code>/save file name,file_id,file_id2,file_id3,file_id4</code>


<h3>How to save file?</h3>

  1.To update already existing filter eg.if you missed one episode of a series
  
  2.use <code>/update file name,file_id</code>

<h3>How to broadcast to all users?</h3>
 
 <code>/send your message</code>
 

<h2>HOW FILES GET SAVED?</h2>

Files that are forwarded to bot will get saved for getting inline search result with caption ,manually saved files may not be having captions for now 
