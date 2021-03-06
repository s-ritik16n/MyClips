'use strict';

var app = angular.module('clip',['ngRoute','ngResource','angularFileUpload','ngFileSaver'])

app.config(function($routeProvider,$locationProvider){
  $locationProvider.html5Mode({enabled:true});
  $routeProvider.
  when('/',{
    templateUrl:"views/main.html",
    controller:"url"
  }).
  when('/:url',{
    templateUrl:"views/url.html",
    controller: "url"
  })
});

app.controller("url",function($scope,$http,$routeParams,$timeout,FileUploader,$location,$sce,$window,FileSaver,Blob){

  $scope.loadURLTemplate = function(){
    var url = $routeParams.url;
    console.log("inside angular code");
    $http.get('/getURL/'+url).success(function(result){
      console.log(result.exist);
      if(result.exist) {
        if(!result.file){
          console.log("content is: "+result.data);
          $scope.content = result.data;
          $scope.exists=false;
        } else {
        $window.location='/getFile/'+url;
        }
      } else {
        $scope.exists = true;
        $scope.content="";
      }
    })
  }
  $scope.redirect = function(){
    if($scope.url !== ""){
      $window.location = '/'+$scope.url;
      }
    }

  $scope.uploadText = function(){
    var url = $routeParams.url;
    if($scope.content == "") return;
    var data = JSON.stringify({
      content:$scope.content
    })
    $http.post('/getURL/'+url,data).success(function(result){
      console.log(result);
      if(result.done){
        $scope.done=true;
      }
    })
  }

  $scope.uploader = new FileUploader()
  var uploadURL = '/postFile/'+$routeParams.url;
  $scope.uploadOptions = {
    queueLimit: 1,
    autoUpload: true,
    url: uploadURL
  }
  $scope.uploadFile = function(){
    if(!$scope.uploader.queue[0]) return;

    //$scope.uploader.queue[0].file.name.split(".")[$scope.uploader.queue[0].file.name.split(".").length-1]
    if ($scope.uploader.queue[0].file.name.split(".")[$scope.uploader.queue[0].file.name.split(".").length-1] !== "pdf") {
      $scope.error = true;
      return;
    } else {
      $scope.error = true;
    }
    console.log($scope.uploader.queue[0].file.name);
    $scope.uploader.queue[0].upload()
    $scope.done = true;
  }
})
