var applicationModule = require("application");
var _isInit = false;
var _AndroidApplication = applicationModule.android;
var _act;
var mCallbackManager;
var mFailCallback
var loginManager;
function init(loginBehavior) {
    try {
        com.facebook.FacebookSdk.sdkInitialize(_AndroidApplication.context.getApplicationContext());
    }
    catch (e) {
        console.log("nativescript-facebook-login: The plugin could not find the android library, try to clean the android platform");
    }
    mCallbackManager = com.facebook.CallbackManager.Factory.create();
    loginManager = com.facebook.login.LoginManager.getInstance();
    loginManager.logOut();
    if (loginBehavior) {
        loginManager = loginManager.setLoginBehavior(loginBehavior);
    }
    if (mCallbackManager && loginManager) {
        _isInit = true;
        return true;
    }
    else {
        return false;
    }
}
exports.init = init;
function registerCallback(successCallback, cancelCallback, failCallback) {
    if (_isInit) {
        mFailCallback = failCallback
        var act = _AndroidApplication.foregroundActivity || _AndroidApplication.startActivity;
        _act = act;
        loginManager.registerCallback(mCallbackManager, new com.facebook.FacebookCallback({
            onSuccess: function (result) {
                successCallback(result);
            },
            onCancel: function () {
                cancelCallback();
            },
            onError: function (e) {
                failCallback(e);
            }
        }));
        act.onActivityResult = function (requestCode, resultCode, data) {
            mCallbackManager.onActivityResult(requestCode, resultCode, data);
        };
    }
}
exports.registerCallback = registerCallback;
function logInWithPublishPermissions(permissions) {
    if (_isInit) {
        var javaPermissions = java.util.Arrays.asList(permissions);
        loginManager.logInWithPublishPermissions(_act, javaPermissions);
    }
}
exports.logInWithPublishPermissions = logInWithPublishPermissions;
function logInWithReadPermissions(permissions) {
    if (_isInit) {
        var javaPermissions = java.util.Arrays.asList(permissions);
        loginManager.logInWithReadPermissions(_act, javaPermissions);
    }
}
exports.logInWithReadPermissions = logInWithReadPermissions;


exports.sdkInit = function(){
    com.facebook.FacebookSdk.sdkInitialize(_AndroidApplication.context)
}

exports.share = function(params){

    //contentURL, contentTitle, imageURL, contentDescription

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

exports.requestUserProfile = function(accessToken, fields, done){   

    console.log("### accessToken.getPermissions()=" + accessToken.getPermissions())

    var request = com.facebook.GraphRequest.newMeRequest(accessToken, new com.facebook.GraphRequest.GraphJSONObjectCallback({        
        onCompleted: function(user, graphResponse) {

            if(graphResponse.getError()){
                var errorString = "Message: " + graphResponse.getError().getErrorMessage() 
                errorString += ", Type: " + graphResponse.getError().getErrorType()
                errorString += ", Code: " + graphResponse.getError().getErrorCode()
                mFailCallback(errorString)
            }else{
                var userJson = {
                    email: user.optString("email"),
                    name: user.optString("name"),
                    id: user.optString("id"),
                    token: accessToken.getToken()              
                }

                done(userJson)            
            }
        }
    }))

    var parameters = new android.os.Bundle();
    parameters.putString("fields", fields);    
    request.setParameters(parameters);
    request.executeAsync()
}