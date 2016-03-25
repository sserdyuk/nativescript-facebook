
var observable = require("data/observable")
var Facebook = require("nativescript-facebook")
var viewModel = new observable.Observable({
	message: ""
})

var facebookHandler

exports.loaded = function(args) {
    var page = args.object;
    page.bindingContext = viewModel;

    facebookHandler = new FacebookHandler()

    facebookHandler.sdkInit()
}

exports.onLogin = function(){

	facebookHandler.login()
}

var FacebookHandler = function(){

	var permissions = ["publuc_profile", "email"]

	FacebookHandler.sdkInit = function(){
		Facebook.init()
		Facebook.registerCallback(this.loginSuccessCallback, this.loginCancelCallback, this.loginFailCallback)
	}

	FacebookHandler.login = function(){	
		Facebook.logInWithReadPermissions(permissions)
	}

	FacebookHandler.loginSuccessCallback = function(){

		var fields = "id,name,email"

		Facebook.requestUserProfile(fields, function(fbUser){

			viewModel.set("message", "Login success: Name=" + fbUser.name + ", Email=" + fbUser.email)

		})

	}

	FacebookHandler.loginCancelCallback = function(){
		viewModel.set("message", "login was canceled by user")
	}

	FacebookHandler.loginFailCallback = function(error){
		viewModel.set("message", "login error: " + error)
	}

	return FacebookHandler
}