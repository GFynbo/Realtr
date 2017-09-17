var Promise = require('q').Promise;

var Promise = require('bluebird');
var Zillow = require('node-zillow');

var zillow = new Zillow('X1-ZWz1fzk9uixlhn_634pbd');

var parameters = {
    zpid: 1111111
  };

var ReviewsOptions = [
    '“Very stylish, great stay, great staff”',
    '“good hotel awful meals”',
    '“Need more attention to little things”',
    '“Lovely small hotel ideally situated to explore the area.”',
    '“Positive surprise”',
    '“Beautiful suite and resort”'];

module.exports = {
    searchApartments: function (destination) {
        return new Promise(function (resolve) {

            // Filling the Apartments results manually just for demo purposes
            var apartments = [];
            for (var i = 1; i <= 5; i++) {
                apartments.push({
                    name: destination + ' Apartment ' + i,
                    location: destination,
                    rating: Math.ceil(Math.random() * 5),
                    numberOfReviews: Math.floor(Math.random() * 5000) + 1,
                    priceStarting: Math.floor(Math.random() * 450) + 80,
                    image: 'https://placeholdit.imgix.net/~text?txtsize=35&txt=Hotel+' + i + '&w=500&h=260'
                });
            }

            zillow.get('GetRegionChildren', parameters)
                .then(function(results){
                    console.log(results);
                })

            apartments.sort(function (a, b) { return a.priceStarting - b.priceStarting; });

            // complete promise with a timer to simulate async response
            setTimeout(function () { resolve(apartments); }, 1000);
        });
    },

    searchNearby: function (object) {
        return new Promise(function (resolve) {
            var arrayContaining = [];
            var objectContaining = [];
            var stringMatching = "";
            var googleMaps = require('./service');

            it('gets places for a text search query', function(done) {
                googleMaps.places({
                    query: 'fast food',
                    language: 'en',
                    location: [-33.865, 151.038],
                    radius: 5000,
                    minprice: 1,
                    maxprice: 4,
                    opennow: true,
                    type: 'restaurant'
                })
                    .asPromise()
                    .then(function(response) {
                        expect(response.json.results).toEqual(
                            arrayContaining([
                                objectContaining({
                                    name: stringMatching('McDonalds')
                                })
                            ]));
                    })
                    .then(done, fail);
            });

            it('gets places for a nearby search query', function(done) {
                googleMaps.placesNearby({
                    language: 'en',
                    location: [-33.865, 151.038],
                    radius: 5000,
                    minprice: 1,
                    maxprice: 4,
                    opennow: true,
                    type: 'restaurant'
                })
                    .asPromise()
                    .then(function(response) {
                        expect(response.json.results).toEqual(
                            arrayContaining([
                                objectContaining({
                                    name: stringMatching('McDonalds')
                                })
                            ]));
                    })
                    .then(done, fail);
            });

            it('gets places for a nearby search query ranked by distance', function(done) {
                googleMaps.placesNearby({
                    language: 'en',
                    location: [-33.865, 151.038],
                    rankby: 'distance',
                    minprice: 1,
                    maxprice: 4,
                    opennow: true,
                    type: 'restaurant'
                })
                    .asPromise()
                    .then(function(response) {
                        expect(response.json.results).toEqual(
                            arrayContaining([
                                objectContaining({
                                    name: stringMatching('McDonalds')
                                })
                            ]));
                    })
                    .then(done, fail);
            });

            it('gets places for a radar search query', function(done) {
                googleMaps.placesRadar({
                    language: 'en',
                    location: [-33.865, 151.038],
                    radius: 5000,
                    type: 'restaurant'
                })
                    .asPromise()
                    .then(function(response) {
                        expect(response.json.results).toEqual(
                            arrayContaining([
                                objectContaining({
                                    place_id: stringMatching('ChIJCYxmm6G8EmsRKx_g00QBeBk')
                                })
                            ]));
                    })
                    .then(done, fail);
            });

            it('can page through results', function(done) {
                googleMaps.places({
                    query: 'restaurant',
                    language: 'en',
                    location: [-33.86746, 151.207090],
                    radius: 5000
                })
                    .asPromise()
                    .then(function(response) {
                        expect(response.json.next_page_token).not.toBeFalsy();
                        function getNextPage() {
                            return googleMaps.places({
                                pagetoken: response.json.next_page_token
                            }).asPromise();
                        }
                        return getNextPage()
                            .then(function repeatWhileInvalid(nextResponse) {
                                if (nextResponse.json.status !== 'INVALID_REQUEST') {
                                    return nextResponse;
                                }

                                // Wait one second, and try again.
                                return new Promise(function(resolve) {
                                    setTimeout(resolve, 1000);
                                })
                                    .then(getNextPage)
                                    .then(repeatWhileInvalid);
                            });
                    })
                    .then(function(nextResponse) {
                        expect(nextResponse.json.status).toBe('OK');
                        expect(nextResponse.json.results.length).not.toBeFalsy();
                    })
                    .then(done, fail);
            }, 10000);

            it('gets details for a place', function(done) {
                googleMaps.place({
                    placeid: 'ChIJc6EceWquEmsRmBVAjzjXM-g',
                    language: 'fr'
                })
                    .asPromise()
                    .then(function(response) {
                        expect(response.json.result).toEqual(
                            objectContaining({
                                name: 'Spice Temple'
                            }));
                    })
                    .then(done, fail);
            });

            it('gets a places photo', function(done) {
                googleMaps.placesPhoto({
                    photoreference: 'CnRvAAAAwMpdHeWlXl-lH0vp7lez4znKPIWSWvgvZFISdKx45AwJVP1Qp37YOrH7sqHMJ8C-vBDC546decipPHchJhHZL94RcTUfPa1jWzo-rSHaTlbNtjh-N68RkcToUCuY9v2HNpo5mziqkir37WU8FJEqVBIQ4k938TI3e7bf8xq-uwDZcxoUbO_ZJzPxremiQurAYzCTwRhE_V0',
                    maxwidth: 100,
                    maxheight: 100
                })
                    .asPromise()
                    .then(function(response) {
                        expect(response.headers['content-type']).toBe('image/jpeg');
                    })
                    .then(done, fail);
            });

            it('gets autocomplete predictions for places', function(done) {
                googleMaps.placesAutoComplete({
                    input: 'pizza',
                    language: 'en',
                    location: [40.724, -74.013],
                    radius: 5000,
                    components: {country: 'us'}
                })
                    .asPromise()
                    .then(function(response) {
                        expect(response.json.predictions).toEqual(
                            arrayContaining([
                                objectContaining({
                                    terms: arrayContaining([
                                        objectContaining({
                                            value: 'NY'
                                        })
                                    ])
                                })
                            ]));
                    })
                    .then(done, fail);
            });

            it('gets autocomplete predictions for a query', function(done) {
                googleMaps.placesQueryAutoComplete({
                    input: 'pizza near New York',
                    language: 'en',
                    location: [40.724, -74.013],
                    radius: 5000
                })
                    .asPromise()
                    .then(function(response) {
                        expect(response.json.predictions).toEqual(
                            arrayContaining([
                                objectContaining({
                                    description: 'pizza near New York, NY, United States'
                                })
                            ]));
                    })
                    .then(done, fail);
            });

        });
    },

    searchApartmentBrokers: function (hotelName) {
        return new Promise(function (resolve) {

            // Filling the review results manually just for demo purposes
            var reviews = [];
            for (var i = 0; i < 5; i++) {
                reviews.push({
                    title: ReviewsOptions[Math.floor(Math.random() * ReviewsOptions.length)],
                    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris odio magna, sodales vel ligula sit amet, vulputate vehicula velit. Nulla quis consectetur neque, sed commodo metus.',
                    image: 'https://upload.wikimedia.org/wikipedia/en/e/ee/Unknown-person.gif'
                });
            }

            // complete promise with a timer to simulate async response
            setTimeout(function () { resolve(reviews); }, 1000);
        });
    }
};