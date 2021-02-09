const userService = require('./services/user-service');
const hotelService = require('./services/hotel-service');
const priceService = require('./services/price-service');
const helper = require('./services/helper');

function findHotelsNearby(lat, lng, radius) {
    const hotels = hotelService.getHotels();

    if (hotels.length <= 0 || !lat|| !lng || !radius) {
        return [];
    }

    let nearbyHotels = hotels.filter(hotel => {
        let distance = helper.distance(hotel.latitude, hotel.longitude, lat, lng);
        hotel.distance = Math.round(distance);
        return distance <= radius;
    });

	return nearbyHotels;
}

function findHotelNearbyWithBestOffer(lat, lng, radius, date) {
    if (!lat || !lng || !radius || !date) {
        return null;
    }
    const nearbyHotels = findHotelsNearby(lat, lng, radius);
    const ridCodes = getRidCodes(nearbyHotels);
    const bestPrice = getBestPrice(ridCodes, date, 'STANDARD');
    const bestHotelData = nearbyHotels.filter(hotel => hotel.ridCode === bestPrice.ridCode)[0];
    bestHotelData.offer = bestPrice.offers[0];

    return (bestHotelData);
}

function findHotelNearbyWithBestOfferForUser(lat, lng, radius, date, userId) {
    if (!lat || !lng || !radius || !date || !userId) {
        return null;
    }
    const nearbyHotels = findHotelsNearby(lat, lng, radius);
    const ridCodes = getRidCodes(nearbyHotels);
    const users = userService.getUsers();
    const user = users.filter(user => user.id === userId);
    const subscription = user[0].subscribed ? 'SPECIAL_OFFER' : 'STANDARD';
    const bestPrice = getBestPrice(ridCodes, date, subscription);
    const bestHotelData = nearbyHotels.filter(hotel => hotel.ridCode === bestPrice.ridCode)[0];
    bestHotelData.offer = bestPrice.offers[0];

    return (bestHotelData);
}

function getBestPrice(ridCodes, date, kind) {
    const matchingOffersByRid = getOffersFromRidCodes(ridCodes);
    const matchingOffersByDateAndKind = getOffersByDateAndKind(matchingOffersByRid, date, kind);
    const bestOffer = matchingOffersByDateAndKind.reduce(function (res, obj) {
        return (obj.offers[0].price < res.offers[0].price) ? obj : res;
    });
    return (bestOffer);
}

function getRidCodes(nearbyHotels) {
    const ridCodes = nearbyHotels.map(hotel => hotel.ridCode);
    return ridCodes;
}

function getOffersFromRidCodes(ridCodes) {
    const prices = JSON.parse(JSON.stringify(priceService.getPrices()));
    const offers = [];
    for (const ridCode of ridCodes) {
        for (const offer of prices) {
            if (offer.ridCode === ridCode) {
                offers.push(offer);
            }
        }
    }
    return (offers);
}

function getOffersByDateAndKind(offersList, date, kind) {
    const offers = [];
    for (const offer of offersList) {
        let matchingDateOffers = offer.offers.filter(offer => offer.date === date && offer.fare === kind);
        if (matchingDateOffers.length > 0) {
            offer.offers = matchingDateOffers;
            offers.push(offer);
        }
    }
    return (offers);
}

module.exports = {
	findHotelsNearby: findHotelsNearby,
	findHotelNearbyWithBestOffer: findHotelNearbyWithBestOffer,
	findHotelNearbyWithBestOfferForUser: findHotelNearbyWithBestOfferForUser
}