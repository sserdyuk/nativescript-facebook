
var facebookApi;

exports.init = function(loginBehavior) {
    if(!facebookApi){
        facebookApi = new Facebook()
        facebookApi.initSdk(loginBehavior)
    }
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

var Facebook = function(){

    Facebook.logInWithPublishPermissions = function(permissions){
        if(this._isInit){
            this.loginManager.logInWithPublishPermissionsHandler(permissions, this._callbackManager);
        }
    }

    Facebook.logInWithReadPermissions = function(permissions){
        if (this._isInit) {
            this.loginManager.logInWithReadPermissionsHandler(permissions, this._callbackManager);
        }        
    }

    Facebook.getAccessToken = function(){
        return FBSDKAccessToken.currentAccessToken()
    }

    Facebook.isLoggedIn = function(){
        return this.getAccessToken() != null
    }

    Facebook.logout = function(){
        if(this._init)
            this.loginManager.logOut();
    }

    Facebook.initSdk = function(loginBehavior){
        this.loginManager = FBSDKLoginManager.alloc().init();
        if (this.loginManager) {
            //this.loginManager.logOut();
            if (loginBehavior) {
                this.loginManager.loginBehavior = loginBehavior;
            }
            this._isInit = true;
            return true;
        }
        else {
            return false;
        }        
    }

    Facebook.registerCallback = function(successCallback, cancelCallback, failCallback){

        this._successCallback = successCallback
        this._cancelCallback = cancelCallback
        this._failCallback = failCallback
        var self = this
        if (this._isInit) {
            this._callbackManager = function (result, error) {
                if (error) {
                    console.log("login error: " + error)
                    // https://developers.facebook.com/docs/ios/errors
                    var message = error.userInfo[FBSDKErrorDeveloperMessageKey]
                    self._failCallback(message);
                    return;
                }
                if (!result) {
                    self._failCallback("Null error");
                    return;
                }
                if (result.isCancelled) {
                    self._cancelCallback();
                    return;
                }
                if (result.token) {
                    self._successCallback(result);
                }
                else {
                    self._failCallback("Could not acquire an access token");
                    return;
                }
            };
        }
    }

    Facebook.share = function(params){

    }

    Facebook.doMeRequest = function(args){

    }

    Facebook.doGraphPathRequest = function(args){

    }

    Facebook.handlerError = function(error){

    }

    return Facebook

}
