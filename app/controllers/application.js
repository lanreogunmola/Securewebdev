import Ember from 'ember';
var Photo = Ember.Object.extend({
	    title: '',
	username: '',
	//flickr extra data
	owner: '',
	//flickr url data
	id: '',
	farm: 0,
	secret: '',
	server: '',
	url: function(){
		return "https://farm"+this.get('farm')+
		".staticflickr.com/"+this.get('server')+
		"/"+this.get('id')+"_"+this.get('secret')+"_b.jpg";
	}.property('farm','server','id','secret'),
});

var PhotoCollection = Ember.ArrayProxy.extend(Ember.SortableMixin, {
	sortProperties: ['dates.taken'],
	sortAscending: false,
	content: [],
});

export default Ember.Controller.extend({
	photos: PhotoCollection.create(),
	    searchField: '',
	    tagSearchField: '',
	    filteredPhotosLoaded: function(){
			return this.get('filteredPhotos').length >0;
		}.property('filteredPhotos.length'),
	    tagList: ['hi','cheese'],
	filteredPhotos: function () {
		var filter = this.get('searchField');
		var rx = new RegExp(filter, 'gi');
		var photos = this.get('photos');

		return photos.filter(function(photo){
			return photo.get('title').match(rx) || photo.get('owner.username').match(rx);
		});
	}.property('photos.@each','searchField'),
	actions: {
				search: function () {
				    this.set('loading', true);
					this.get('photos').content.clear();
					this.store.unloadAll('photo');
					this.send('getPhotos',this.get('tagSearchField'));
				},
				getPhotos: function(tag){
				var apiKey = 'f73a4f9b7486132776d620f10d4ccf93';
				var host = 'https://api.flickr.com/services/rest/';
				var method = "flickr.photos.search";
				var requestURL = host + "?method="+method + "&api_key="+apiKey+"&tags="+tag+"&per_page=50&format=json&nojsoncallback=1";
				var photos = this.get('photos');
				var t = this;
				Ember.$.getJSON(requestURL, function(data){
					//callback for successfully completed requests
					//make secondary requests to get all of the photo information
					data.photos.photo.map(function(photoitem) {//iterate over each photo
						var infoRequestURL = host + "?method="+"flickr.photos.getInfo" + "&api_key="+apiKey+ "&photo_id="+photoitem.id+"&format=json&nojsoncallback=1";
						Ember.$.getJSON(infoRequestURL, function(item){
							var photo = item.photo;
							var tags = photo.tags.tag.map(function(tagitem){
								return tagitem._content;
							});
							var newPhotoItem = t.store.createRecord('photo',{
								title: photo.title._content,
								dates: photo.dates,
								owner: photo.owner,
								description: photo.description._content,
								link: photo.urls.url[0]._content,
								views: photo.views,
								tags: tags,
								//flickr url data
								id: photo.id,
								farm: photo.farm,
								secret: photo.secret,
								server: photo.server,
							});
							photos.pushObject(newPhotoItem);
						});
					});
				});
			},
				clicktag: function(tag){
				this.set('tagSearchField', tag);
				this.set('loading', true);
				this.get('photos').content.clear();
				this.store.unloadAll('photo');
				this.send('getPhotos',tag);
				}

			},
			init: function(){
			this._super.apply(this, arguments);
			var apiKey = 'f73a4f9b7486132776d620f10d4ccf93';
			var host = 'https://api.flickr.com/services/rest/';
			var method = "flickr.tags.getHotList";
			var requestURL = host + "?method="+method + "&api_key="+apiKey+"&count=75&format=json&nojsoncallback=1";
			var t = this;
			Ember.$.getJSON(requestURL, function(data){
				//callback for successfully completed requests
				console.log(data);
				data.hottags.tag.map(function(tag) {
					t.get('tagList').pushObject(tag._content);
				});
			});
		}
             
});
