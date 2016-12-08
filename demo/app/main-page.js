
var observable = require("data/observable")
var Facebook = require("nativescript-facebook").Facebook
var fs = require("file-system");
var viewModel = new observable.Observable({
	message: ""
})

var facebookHandler
var facebookApi

exports.loaded = function(args) {
    var page = args.object;
    page.bindingContext = viewModel;

    facebookHandler = new FacebookHandler()
    facebookHandler.init()
}

exports.onLogin = function(){

	facebookHandler.login()
}

exports.onShare = function(){
	facebookHandler.share()
}

exports.onSharePhoto = function(){
	facebookHandler.sharePhoto()
}

var FacebookHandler = function(){

	var permissions = ["public_profile", "email"]

	FacebookHandler.init = function(){
		if(!facebookApi){
			facebookApi = new Facebook()
			facebookApi.initSdk()
			facebookApi.registerCallback(this.loginSuccessCallback, this.loginCancelCallback, this.loginFailCallback)
		}
	}

	FacebookHandler.login = function(){	
		facebookApi.logInWithReadPermissions(permissions)
	}

	FacebookHandler.loginSuccessCallback = function(){

		var fields = "id,name,email"

		facebookApi.requestUserProfile({
			fields: fields,
			doneCallback: function(fbUser){

			viewModel.set("message", "Login success: " + JSON.stringify(fbUser))

			}
		})

	}

	FacebookHandler.share = function(){
		if(facebookApi.isLoggedIn()){

			Facebook.share({
				content: "Nativescript facebook plugin!",
				url: "http://www.mobilemind.com.br",				
			})
		}else{
			viewModel.set("message", "app is not logged in")
		}
	}

	FacebookHandler.sharePhoto = function(){
		if(facebookApi.isLoggedIn()){

			var documents = fs.knownFolders.currentApp();
			var path = fs.path.join(documents.path, "res/icon.png")

			facebookApi.sharePhoto({
				generalContent: "Nativescript facebook plugin! http://www.mobilemind.com.br",				
				content: "Nativescript",
				imagePath: path
			})
		}else{
			viewModel.set("message", "you not is loggedin")
		}
	}	

	FacebookHandler.loginCancelCallback = function(){
		viewModel.set("message", "action canceled by user")
	}

	FacebookHandler.loginFailCallback = function(error){
		viewModel.set("message",  "error: " + error)
	}


	return FacebookHandler
}