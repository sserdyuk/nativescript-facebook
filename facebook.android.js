var applicationModule = require("application");
var _AndroidApplication = applicationModule.android;

var facebookApi 

exports.init = function(loginBehavior) {
    facebookApi = new Facebook()
    facebookApi.initSdk(loginBehavior)
}

exports.registerCallback = function(successCallback, cancelCallback, failCallback) {
    facebookApi.registerCallback(successCallback, cancelCallback, failCallback)
}

exports.logInWithPublishPermissions = function(permissions) {
    facebookApi.logInWithPublishPermissions(permissions)
}

exports.logInWithReadPermissions = function(permissions) {
    facebookApi.logInWithReadPermissions(permissions)
}

exports.share = function(params){
    facebookApi.share(params)    
}

exports.requestUserProfile = function(fields, doneCallback){   

    //console.log("### accessToken.getPermissions()=" + accessToken.getPermissions())

    var parameters = new android.os.Bundle();
    parameters.putString("fields", fields);    

    var accessToken = facebookApi.getAcessToken()

    facebookApi.doMeRequest(accessToken, parameters, function(fbUser){
        var json = toJson(fbUser)
        json.token = accessToken.getToken()              
        doneCallback(json)
    })   
}

exports.requestBooks = function(fields, doneCallback){   

    //console.log("### accessToken.getPermissions()=" + accessToken.getPermissions())

    var graphPath = "/me/books.reads"
    var accessToken = facebookApi.getAcessToken()

    facebookApi.doGraphPathRequest(accessToken, graphPath, function(entities){
        var json = toJsonrray(entities)        
        doneCallback(json)
    })   
}


exports.isLoggedIn = function(){
    return facebookApi.isLoggedIn()
}

exports.getToken = function(){
    facebookApi.getAcessToken()
}

function toJson(entity){
    var keys = entity.keys()
    var json = {}    
    
    while(keys.hasNext()){

        var key = keys.next()

        json[key] = entity.opt(key).toString()        
    }

    return json
}

function toJsonrray(entities){

    var jsonArray = []

    for(var j = 0; j < entities.length(); j++){
        
        var entity = entities[j]
        var keys = entity.keys()
        var json = {}
        
        while(keys.hasNext()){
            var key = keys.next()

            json[key] = entity.opt(key).toString()        
        }

        jsonArray.push(json)
    }

    return jsonArray
}


var Facebook = function(){
    
    Facebook.logInWithPublishPermissions = function(permissions) {
        if (this._isInit) {
            var javaPermissions = java.util.Arrays.asList(permissions);
            this.loginManager.logInWithPublishPermissions(this._act, javaPermissions);
        }
    }

    Facebook.logInWithReadPermissions = function(permissions) {
        if (this._isInit) {
            var javaPermissions = java.util.Arrays.asList(permissions);
            this.loginManager.logInWithReadPermissions(this._act, javaPermissions);
        }
    }    

    Facebook.getAcessToken = function(){
        return com.facebook.AccessToken.getCurrentAccessToken();
    }

    Facebook.isLoggedIn = function(){
        return this.getAcessToken() != null
    }


    Facebook.logout = function(){
        if(this._isInit)
            this.loginManager.logOut();
    }

    Facebook.initSdk = function(loginBehavior){

        if(this._isInit)
            return true

        try {
            com.facebook.FacebookSdk.sdkInitialize(_AndroidApplication.context.getApplicationContext());
        }catch (e) {
            console.log("nativescript-facebook-login: The plugin could not find the android library, try to clean the android platform");
        }
                
        this.mCallbackManager = com.facebook.CallbackManager.Factory.create();
        this.loginManager = com.facebook.login.LoginManager.getInstance();            

        if (loginBehavior) 
            this.loginManager = this.loginManager.setLoginBehavior(loginBehavior);
        

        if (this.mCallbackManager && this.loginManager) {
            this._isInit = true;
            return true;
        }else {
            return false;
        }          
    }

    Facebook.registerCallback = function(successCallback, cancelCallback, failCallback){
        this._failCallback  = failCallback
        this._successCallback  = successCallback
        this._cancelCallback = cancelCallback

        if (this._isInit) {            
            var self = this
            this._act = _AndroidApplication.foregroundActivity || _AndroidApplication.startActivity;
            
            this.loginManager.registerCallback(this.mCallbackManager, new com.facebook.FacebookCallback({
                onSuccess: function (result) {
                    self._successCallback(result);
                },
                onCancel: function () {
                    self._cancelCallback();
                },
                onError: function (e) {
                    self._failCallback(e);
                }
            }));
            
            this._act.onActivityResult = function (requestCode, resultCode, data) {
                self.mCallbackManager.onActivityResult(requestCode, resultCode, data);
            };
        }        
    }    

    //contentURL, contentTitle, imageURL, contentDescription
    Facebook.share = function(params){
        var activity = _AndroidApplication.foregroundActivity
        var builder = new com.facebook.share.model.ShareLinkContent.Builder()            
        
        if(params.contentURL)
            builder.setContentUrl(android.net.Uri.parse(params.contentURL))

        if(params.contentTitle)
            builder.setContentTitle(params.contentTitle)

        if(params.imageURL)
            builder.setImageUrl(android.net.Uri.parse(params.imageURL))

        if(params.contentDescription)
            builder.setContentDescription(params.contentDescription)

        var content = builder.build();     

        com.facebook.share.widget.ShareDialog.show(activity, content)        
    }

    Facebook.doMeRequest = function(accessToken, budle, doneCallback){   

        console.log("### accessToken.getPermissions()=" + accessToken.getPermissions())

        var self = this
        var request = com.facebook.GraphRequest.newMeRequest(accessToken, new com.facebook.GraphRequest.GraphJSONObjectCallback({        
            onCompleted: function(entity, graphResponse) {

                if(graphResponse.getError()){                    
                    self.handlerError(graphResponse.getError())
                }else{
                    doneCallback(entity)            
                }
            }
        }))

        if(budle)
            request.setParameters(budle);

        request.executeAsync()
    }

    Facebook.doGraphPathRequest = function(accessToken, graphPath, doneCallback){   

        console.log("### accessToken.getPermissions()=" + accessToken.getPermissions())
        //var graphPath = "/me/books.reads"
        
        var self = this
        var request = com.facebook.GraphRequest.newGraphPathRequest(accessToken, graphPath, new com.facebook.GraphRequest.GraphJSONArrayCallback({        
            onCompleted: function(entities, graphResponse) {

                if(graphResponse.getError()){
                    self.handlerError(graphResponse.getError())
                }else{                    
                    doneCallback(entities)            
                }
            }
        }))

        request.executeAsync()
    }    


    Facebook.handlerError = function(error){

        var errorString = "Message: " + error.getErrorMessage() 
        errorString += ", Type: " + error.getErrorType()
        errorString += ", Code: " + error.getErrorCode()

        if(this._failCallback)
            this._failCallback(errorString)

    }

    return Facebook
}

exports.Facebook = Facebook