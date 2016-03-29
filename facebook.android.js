var applicationModule = require("application");
var _AndroidApplication = applicationModule.android;

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
        }catch (error) {
            console.log("nativescript-facebook-login: The plugin could not find the android library, try to clean the android platform. " + error);
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

    // args = { fields, doneCallback}
    Facebook.requestUserProfile = function(args){   

        //console.log("### accessToken.getPermissions()=" + accessToken.getPermissions())

        var parameters = new android.os.Bundle();
        if(args.fields)
            parameters.putString("fields", args.fields);    

        var accessToken = this.getAcessToken()

        this.doMeRequest(accessToken, parameters, function(fbUser){
            var json = toJson(fbUser)
            json.token = accessToken.getToken()              
            args.doneCallback(json)
        })   
    }

    Facebook.requestBooks = function(fields, doneCallback){   

        //console.log("### accessToken.getPermissions()=" + accessToken.getPermissions())

        var graphPath = "/me/books.reads"
        var accessToken = this.getAcessToken()

        this.doGraphPathRequest(accessToken, graphPath, function(entities){
            var json = toJsonrray(entities)        
            doneCallback(json)
        })   
    }     

    //url, title, content, imageUrl
    Facebook.share = function(params){
        try{
            var activity = _AndroidApplication.foregroundActivity
            var builder = new com.facebook.share.model.ShareLinkContent.Builder()            
            
            if(params.url)
                builder.setContentUrl(android.net.Uri.parse(params.url))

            if(params.title)
                builder.setContentTitle(params.title)

            if(params.imageUrl)
                builder.setImageUrl(android.net.Uri.parse(params.imageUrl))

            if(params.content)
                builder.setContentDescription(params.content)

            var content = builder.build();     

            com.facebook.share.widget.ShareDialog.show(activity, content)   
        }catch(error){
            console.log(error)
            this._failCallback(error)
        }     
    }

    // imagePath, content, imageUrl
    Facebook.sharePhoto = function(params){
        try{
            var activity = _AndroidApplication.foregroundActivity
        
            var builder = new com.facebook.share.model.SharePhotoContent().Builder()
            var photo = this.createPhotoShare(params)
            var content = builder.addPhoto(photo).build();

            com.facebook.share.widget.ShareDialog.show(activity, content)  
        }catch(error){
            console.log(error)
            this._failCallback(error)
        }      
    }  

    // list of {imagePath, content, imageUrl}
    Facebook.sharePhotos = function(args){
        try{
            var activity = _AndroidApplication.foregroundActivity
            
            var builder = new com.facebook.share.model.SharePhotoContent().Builder()
            var photos = []

            for(var i in args.list){
                photos.push(this.createPhotoShare(args.list[i]))
            }

            for(var i in photos)
                builder.addPhoto(photos[i])

            var content = builder.build();

            com.facebook.share.widget.ShareDialog.show(activity, content) 
        }catch(error){
            console.log(error)
            this._failCallback(error)
        }       
    }  

    Facebook.createPhotoShare = function(params){
        var builder = new com.facebook.share.model.SharePhoto.Builder();
        var bmOptions = new android.graphics.BitmapFactory.Options();
        var bitmap

        if(params.imagePath)
            bitmap = android.graphics.BitmapFactory.decodeFile(params.imagePath, bmOptions);        

        if(bitmap)
            builder.setBitmap(bitmap);

        if(params.content)
            builder.setCaption(params.content);

        if(params.content)
            builder.setCaption(params.content);

        if(params.imageUrl)
            builder.setImageUrl(android.net.Uri.parse(params.imageUrl))

        builder.setUserGenerated(true);

        return builder.build();     
    }  

    Facebook.doMeRequest = function(accessToken, budle, doneCallback){   

        try{
            console.log("### accessToken.getPermissions()=" + accessToken.getPermissions())

            var self = this
            var request = com.facebook.GraphRequest.newMeRequest(accessToken, new com.facebook.GraphRequest.GraphJSONObjectCallback({        
                onCompleted: function(entity, graphResponse) {

                    console.log("## Facebook onCompleted")

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
        }catch(error){
            console.log(error)
            this._failCallback(error)
        }
    }

    Facebook.doGraphPathRequest = function(accessToken, graphPath, doneCallback){   

        try{
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
        }catch(error){
            console.log(error)
            this._failCallback(error)
        }
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

function toJson(entity){

    console.log("## toJson " + entity)

    var keys = entity.keys()
    var json = {}    
    
    console.log("## toJson key=" + key)

    while(keys.hasNext()){

        var key = keys.next()

        console.log("## toJson key=" + key)

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

exports.Facebook = Facebook