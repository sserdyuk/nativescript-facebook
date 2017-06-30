var application = require('application')

var Facebook = function(){

    var default_permissions = ["public_profile", "email"]
    var default_fileds = "id,name,email"

    Facebook.logInWithPublishPermissions = function(permissions){
        if(this._isInit){
            this.loginManager.logInWithPublishPermissionsHandler(permissions || default_permissions, this._callbackManager);
        }
    }

    Facebook.logInWithReadPermissions = function(permissions){
        if (this._isInit) {
            this.loginManager.logInWithReadPermissionsHandler(permissions || default_permissions, this._callbackManager);
        }
    }

    Facebook.getAccessToken = function(){
        var accessToken = FBSDKAccessToken.currentAccessToken()
        return accessToken
    }

    Facebook.isLoggedIn = function(){
        return this.getAccessToken() != null
    }

    Facebook.logOut = function(){
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
                    self.handlerError(error)
                    return;
                }
                if (!result) {
                    self._failCallback("Null error");
                    return;
                }

                //console.log("## result=" + result)

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

    // args = {fields , callback }
    Facebook.requestUserProfile = function(args){

        args = args || { fields: default_fileds }

        this.doMeRequest({
            bundle: {
                fields: args.fields || { fields: default_fileds }
            },
            callback: function(result){
                args.callback(toJson(result))
            }
        })
    }

    // Facebook.requestBooks = function(args){

    //     var fields = args.fields
    //     var callback = args.callback

    //     var args = {
    //       graphPath: "/me/books.reads",
    //       bundle: {
    //         fields: fields
    //       },
    //       callback: function(graphResponse){
    //         var json = toJson(result)
    //         callback(json.data)
    //       }
    //     }
    //     this.doGraphPathRequest(args)
    // }

    Facebook.requestFriends = function(args){

        var userId = args.userId
        var callback = args.callback
        var fields = args.fields

        if(!userId || userId.trim().length == 0){
          this._failCallback("facebook user id cannot be null to this request")
          return
        }

        var args = {
            graphPath: "/" + userId + "/friends",
            bundle: {
              fields: fields
            },
            callback: function(result){
                var json = toJson(result)
                callback(json.data)
            }
        }

        this.doGraphPathRequest(args)
    }

    // url, title, content, imageUrl
    Facebook.share = function(params){

        try{
            var content = FBSDKShareLinkContent.alloc().init()

           if(params.url)
                content.contentURL = NSURL.URLWithString(params.url)

            if(params.ref)
                content.ref = params.ref

            var view = application.ios.rootController

            var mydelegate = this.createSharingDelegate()

            FBSDKShareDialog.showFromViewControllerWithContentDelegate(view, content, mydelegate);
        }catch(error){
            console.log("## error=" + error)
            this._failCallback(error)
        }
    }

    // // imagePath, content, imageUrl
    // Facebook.sharePhoto = function(args){
    //     try{

    //         if(!this.isInstalled()){
    //             this._failCallback("facebook app not installed")
    //             return
    //         }

    //         var content = FBSDKSharePhotoContent.alloc().init()

    //         var photo = this.createPhotoShare(args)
    //         content.photos = [photo];
    //         var view = application.ios.rootController


    //         var mydelegate = this.createSharingDelegate()

    //         FBSDKShareDialog.showFromViewControllerWithContentDelegate(view, content, mydelegate);

    //     }catch(error){
    //         console.log("## error=" + error)
    //         this._failCallback(error)
    //     }
    // }

    // // args = list of {imagePath, content, imageUrl}
    // Facebook.sharePhotos = function(args){

    //     try{

    //         if(!this.isInstalled()){
    //             this._failCallback("facebook app not installed")
    //             return
    //         }

    //       var content = FBSDKSharePhotoContent.alloc().init()
    //       var photos = []

    //       for(var i in args.list){
    //         photos.push(this.createPhotoShare(args.list[i]))
    //       }

    //       content.photos = photos;


    //       var view = application.ios.rootController

    //       var mydelegate = this.createSharingDelegate()
    //       FBSDKShareDialog.showFromViewControllerWithContentDelegate(view, content, mydelegate);

    //     }catch(error){
    //         console.log("## error=" + error)
    //         this._failCallback(error)
    //     }
    // }

    Facebook.isInstalled = function(){
        var nsUrl = NSURL.URLWithString("fbapi://")
        var isInstalled = canOpenURL(nsUrl)
        return isInstalled
    }

    Facebook.createPhotoShare = function(args){

        var photoShare = FBSDKSharePhoto.alloc().init()

        if(args.imagePath)
            photoShare.image = UIImage.imageWithContentsOfFile(args.imagePath);

        if(args.imageUrl)
            photoShare.imageURL = NSURL.URLWithString(args.imageUrl)

        if(args.content)
            photoShare.caption = args.content

        photoShare.userGenerated = true;

        return photoShare
    }

    Facebook.doMeRequest = function(args){
        args.graphPath = "me"
        this.doGraphPathRequest(args)
    }

    Facebook.doGraphPathRequest = function(args){
        var self = this

        args.bundle = args.bundle || {}

        console.log("## doGraphPathRequest path=" + args.graphPath + ", args.bundle=" + JSON.stringify(args.bundle))

        try{
            if(this.isLoggedIn()){
                var request = FBSDKGraphRequest.alloc().initWithGraphPathParameters(args.graphPath, args.bundle);
                request.startWithCompletionHandler(function(connection, result, error){

                    if(error){
                        self.handlerError(error)
                        return
                    }

                    if(!result){
                        self._failCallback("Null error")
                        return
                    }

                    args.callback(result)

                })
            }else{
                self._failCallback("app is not logged")
            }
        }catch(error){
            console.log("## error=" + error)
            this._failCallback(error)
        }
    }

    Facebook.handlerError = function(error){
        console.log("login error: " + error)
        // https://developers.facebook.com/docs/ios/errors
        var message = error.userInfo.objectForKey(FBSDKErrorDeveloperMessageKey)
        this._failCallback(message);
    }

    Facebook.createSharingDelegate = function(){
        var self = this
        var MySharingDelegate = (function (_super) {
            __extends(MySharingDelegate, _super);
            function MySharingDelegate() {
                _super.apply(this, arguments);
            }
            MySharingDelegate.prototype.sharerDidCompleteWithResults = function (sharer, results) {
                self._successCallback(results)
            };
            MySharingDelegate.prototype.sharerDidFailWithError = function (sharer, error) {
                // self._failCallback(error)
                self.handlerError(error)
            };
            MySharingDelegate.prototype.sharerDidCancel = function (sharer) {
                self._cancelCallback()
            };

            MySharingDelegate.ObjCProtocols = [FBSDKSharingDelegate];

            return MySharingDelegate;

        }(UIResponder));

        return new MySharingDelegate()
    }
    return Facebook

}

function openURL(url) {
  if(typeof UIApplication.sharedApplication === 'function'){
      UIApplication.sharedApplication().openURL(url)
  } else {
    UIApplication.sharedApplication.openURL(url)
  }
}

function canOpenURL(url) {
  if(typeof UIApplication.sharedApplication === 'function'){
      return UIApplication.sharedApplication().canOpenURL(url)
  } else {
    return UIApplication.sharedApplication.canOpenURL(url)
  }
}

function toJson(entity){

  var json = {}

  for(var i = 0; i <  entity.allKeys.count; i++){
    var key = entity.allKeys.objectAtIndex(i)
    var value = entity.objectForKey(key)

    if(value.allKeys)
      json[key] = toJson(value)
    else if(value.count != undefined)
      json[key] = toJsonrray(value)
    else if(value)
      json[key] = value
  }

  return json
}

function toJsonrray(items){

    var array = []

    for(var j = 0; j < items.count; j++){
        var entity = items.objectAtIndex(j)
        var json = toJson(entity)
        array.push(json)
    }

    return array
}

exports.Facebook = Facebook
