const express=require('express');
const app=express();
// ejs
const ejs=require('ejs');
app.set('view engine','ejs');
// socket.io
const http=require('http').Server(app);
const io=require('socket.io')(http);

// post
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(`/public`,express.static('./public/'))
const db=require('./model/db.js');

// session
var session = require('express-session')
// 持久化
var NedbStore = require('nedb-session-store')( session );
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie:{
  	maxAge:100000000
  },
  // 配置持久化
store: new NedbStore({
      filename: 'path_to_nedb_persistence_file.db'
    })
}
))


//加载主路由，如果在登录状态，则加载blog页面，如果不在登录状态，则加载index页面。
app.get(`/`,(req,res)=>{
	if(req.session.login){
		db.find('useInfo','content',{},res,function(a){
		   if(a.length!=0){
		   	  	res.render('blog',{list:a,toShow:true,user:req.session.user})
		   }else{
		   		
		   		res.render('blog',{list:a,toShow:false,user:req.session.user})
		   }

	   })
	}else{
		db.find('useInfo','content',{},res,function(a){
		   if(a.length!=0){
		   	  	res.render('index',{list:a,toShow:true,user:req.session.user})
		   }else{
		   		
		   		res.render('index',{list:a,toShow:false,user:req.session.user})
		   }

	   })
	}
	
})



//判断用户名是否存在，
app.post(`/reg_user`,urlencodedParser,(req,res)=>{
	var reg_user=req.body.reg_user;
	db.find('useInfo','useInfo1',{name:reg_user},res,function(a){
		  if(a.length==0){
		  	res.send({'status':true})
		  }else{
		  	res.send({'status':false})
		  }
	})
})
//判断是否拥有用户名，插入数据。
app.post(`/register`,urlencodedParser,(req,res)=>{
	var reg_user=req.body.reg_user;
	var reg_pass=req.body.reg_pass;
	db.find('useInfo','useInfo1',{name:reg_user},res,function(a){
		  if(a.length==0){
					var obj={
						name:reg_user,
						password:reg_pass
					}
					db.insert('useInfo','useInfo1',obj,res,function(a){
						console.log('插入成功!');
					})
		  	res.send({'status':true})
		  	
		  }else{
		  	res.send({'status':false})
		  }
	})


})

app.use(`/login`,(req,res)=>{
	
	res.render('login',{show:false});
})
//跳转到注册页面
app.use(`/registerPage`,(req,res)=>{
	
	res.render('register');
})

//跳转到登录界面
app.use(`/loginPage`,(req,res)=>{
	res.render('login',{show:true});
})

//跳转到原界面
app.use(`/toHangout`,(req,res)=>{
	res.send({'status':true})
})

//判断登录的用户名是否存在
app.post(`/log_user`,urlencodedParser,(req,res)=>{
	var log_user=req.body.log_user;
	db.find('useInfo','useInfo1',{name:log_user},res,function(a){
		  if(a.length==0){
		  	res.send({'status':false})
		  }else{
		  	res.send({'status':true})
		  }
	})
})


//判断是否能够登录成功，如果能，则加载到session中去
app.post(`/toLogin`,urlencodedParser,(req,res)=>{
	var log_user=req.body.log_user;
	var log_pass=req.body.log_pass;
	db.find('useInfo','useInfo1',{name:log_user,password:log_pass},res,function(a){
		  if(a.length==0){
		  	res.send({'status':false})
		  }else{
		  	req.session.user=log_user;
		  	req.session.login=true;
		  	res.send({'status':true})
		  }
	})


})

//退出登录的代码
app.use(`/toLoginout`,(req,res)=>{
	      req.session.user='';
		  	req.session.login=false;
		  	db.find('useInfo','content',{},res,function(a){
		   if(a.length!=0){
		   	  	res.render('index',{list:a,toShow:true,user:req.session.user})
		   }else{
		   		
		   		res.render('index',{list:a,toShow:false,user:req.session.user})
		   }

	   })
		  
})


//跳转到主页面的代码
app.use(`/index`,(req,res)=>{
	res.render('index',{user:req.session.user,show:true})
})


app.use(`/upDate`,(req,res)=>{
	res.send({'status':true})
})


app.use(`/blog`,(req,res)=>{
	db.find('useInfo','content',{},res,function(a){
		   if(a.length!=0){
		   	  	res.render('blog',{list:a,toShow:true,user:req.session.user})
		   }else{
		   		
		   		res.render('blog',{list:a,toShow:false,user:req.session.user})
		   }

	})
})


io.on('connection',(socket)=>{
	// 接收数据，第一个参数：本次连接名字。第二个参数：收到的数据
	socket.on('sendBlog',(msg,res)=>{
		var obj={       
			            user:msg.user,
					    content:msg.info,
						  time:msg.sendTime,
						  num:[],
						  commentInfo:[]
					}
					db.insert('useInfo','content',obj,res,function(a){
					})        
//		io.emit('send',obj)
	})
	
});

app.post(`/deleData`,urlencodedParser,(req,res)=>{
	var time=req.body.time;
	var user=req.body.user;
	db.find('useInfo','content',{time:time},res,function(a){
		   if(a.length!=0){
		   	console.log(user);
		   	console.log(a[0].user)
		   	    if(user==a[0].user){
		   	    	db.delete('useInfo','content',{user:user},res,function(a){
		        	res.send({'status':true})
	            })
		   	    }else{
		   	    	res.send({'status':false})
		   	    }
		   }
	   })
	


})

app.post(`/perfect`,urlencodedParser,(req,res)=>{
	var time=req.body.time;
	var user=req.body.user;
	db.find('useInfo','content',{time:time},res,function(a){
		  if(a.length!=0){
		  	if(a[0].num.indexOf(user)==-1){
		  		a[0].num.push(user);
		  		num=a[0].num;
		  		console.log(a[0].num)
                db.update('useInfo','content',{time:time},res,{$set:{num:num}});
                res.send({'status':true})
		  	}else{
		  		 var userIndex=a[0].num.indexOf(user);
		  		 a[0].num.splice(userIndex,1);
		  		 num=a[0].num;
		  		 	console.log(a[0].num)
                db.update('useInfo','content',{time:time},res,{$set:{num:num}});
                res.send({'status':true})
		  		 
		  	}
		  }
	})
})


  app.post(`/toComment`,urlencodedParser,(req,res)=>{
	var beCommenter=req.body.beCommenter;
	var commenter=req.body.commenter;
	var commentText=req.body.commentText;
	var commentTime=req.body.commentTime;
	var beCommenttime=req.body.beCommenttime;
	console.log(commentTime)
var commentArr=[commenter,beCommenter,commentText,commentTime];
	db.find('useInfo','content',{time:beCommenttime},res,function(a){
		  
			if(a.length!=0){
				
		a[0].commentInfo.push(commentArr);
      var commentInfo=a[0].commentInfo;
      db.update('useInfo','content',{time:beCommenttime},res,{$set:{commentInfo:commentInfo}});
      res.send({'status':true});
      
			}else{
				res.send({'status':false});
		}
	})
	
		})
	
http.listen(8888);