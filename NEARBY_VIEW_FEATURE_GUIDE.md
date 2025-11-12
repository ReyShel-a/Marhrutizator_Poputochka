# Nearby View Feature Guide

## Overview

The Nearby View feature allows users to see all active drivers and available rides in their vicinity on an interactive real-time map. The system automatically updates every 30 seconds to show the latest available routes.

## Accessing the Feature

### From Home Page
1. Open the application
2. Click the prominent **"🗺️ Посмотреть ближайшие поездки"** button
3. The system will request GPS permission

### Direct URL
Navigate to `/nearby` in your browser

## Features

### 1. Real-Time Location Tracking
- **Automatic GPS Request**: The app automatically requests permission to access your location
- **Current Position Display**: Your location is shown with a blue circle marker
- **Address Display**: Shows your current address at the bottom of the map

### 2. Nearby Routes Display
- **20km Radius**: Shows all active routes within 20 kilometers
- **Driver Markers**: Blue pins indicate driver locations (route starting points)
- **Passenger Markers**: Green pins show passenger pickup points
- **Route Count**: Displays the number of available routes

### 3. Interactive Map
- **Clickable Markers**: Tap any marker to see detailed information
- **Info Windows**: Shows driver/passenger details, vehicle info, pricing
- **Navigation**: Click on routes to view full details
- **Zoom & Pan**: Standard map controls for navigation

### 4. Automatic Updates
- **30-Second Refresh**: Routes automatically update every 30 seconds
- **Visual Indicator**: Bottom-right indicator shows auto-update status
- **Manual Refresh**: Tap the refresh button to update immediately
- **Last Update Time**: Shows when data was last refreshed

### 5. Route List
- **Bottom Sheet**: Scrollable list of all nearby routes
- **Quick Info**: See driver, vehicle, destination, price at a glance
- **Tap to Navigate**: Click any route to see full details

## User Interface

### Header
- **Title**: "Ближайшие поездки"
- **Refresh Button**: Manual refresh control
- **Location Info**: Current address display

### Statistics Bar
- **Route Count**: Number of available routes
- **Last Update**: Timestamp of last data refresh
- **Error Messages**: Displays any loading errors

### Map Area
- **Full Screen**: Maximizes map visibility
- **Current Location**: Blue circle with accuracy indicator
- **Route Markers**: Color-coded pins for drivers/passengers
- **Info Windows**: Popup details on marker click

### Route List (Bottom Sheet)
- **Scrollable**: View all routes without leaving the map
- **Route Cards**: Each card shows:
  - Driver name and phone
  - Vehicle details (make, color, license plate)
  - Route (origin → destination)
  - Departure time
  - Price per kilometer
  - Available seats

### Auto-Update Indicator
- **Fixed Position**: Bottom-right corner
- **Pulsing Dot**: Green indicator shows active updates
- **Text**: "Автообновление каждые 30 сек"

## Error Handling

### GPS Permission Denied
- **Error Message**: "User denied the request for Geolocation..."
- **Retry Button**: Allows requesting permission again
- **Manual Entry**: Option to enter location manually (future feature)

### No GPS Available
- **Error Message**: "Location information is unavailable..."
- **Suggestion**: Check GPS settings
- **Retry Option**: Try again button

### No Routes Found
- **Empty State**: Shows search icon and message
- **Message**: "Поблизости нет активных маршрутов"
- **Call-to-Action**: Button to create a new route
- **Auto-Retry**: Will check again in 30 seconds

### Network Errors
- **Error Banner**: Yellow warning banner
- **Error Message**: Describes the issue
- **Retry Button**: Manual retry option
- **Cached Data**: Shows last known routes if available

## Marker Information

### Driver Markers (Blue)
**Information Displayed:**
- Driver name
- Phone number
- Vehicle make and color
- License plate number
- Available seats
- Price per kilometer
- Departure time
- Destination address

### Passenger Markers (Green)
**Information Displayed:**
- Passenger name
- Phone number
- Comments/notes
- Destination address
- Booking price

### Current Location (Blue Circle)
**Information Displayed:**
- "Ваше местоположение"
- Current address
- Accuracy circle (50m radius)

## Usage Scenarios

### Scenario 1: Finding a Ride
1. Open Nearby View
2. Allow GPS access
3. View available routes on map
4. Click markers to see details
5. Select a route from the list
6. Navigate to route details to book

### Scenario 2: Checking Demand (Driver)
1. Open Nearby View
2. See passenger markers (green pins)
3. Identify areas with high demand
4. Create route to serve those areas

### Scenario 3: Real-Time Monitoring
1. Open Nearby View
2. Leave app open
3. System auto-updates every 30 seconds
4. Watch for new routes appearing
5. Quick access to new opportunities

## Performance

### Data Usage
- **Initial Load**: ~50-100 KB
- **Each Update**: ~10-50 KB (depending on route count)
- **30-Second Interval**: ~120-300 KB per hour
- **Optimized**: Only loads active routes

### Battery Usage
- **GPS**: Moderate battery usage
- **Auto-Update**: Minimal impact (30s interval)
- **Map Rendering**: Standard Google Maps usage

### Speed
- **Initial Load**: < 2 seconds
- **GPS Lock**: 1-5 seconds
- **Route Load**: < 1 second
- **Marker Display**: Instant

## Tips & Best Practices

### For Passengers
1. **Enable GPS**: Ensure location services are on
2. **Check Regularly**: Routes update frequently
3. **Act Fast**: Popular routes fill up quickly
4. **Use Filters**: (Future) Filter by time, price, seats

### For Drivers
1. **Monitor Demand**: See where passengers are waiting
2. **Timing**: Create routes when demand is high
3. **Visibility**: Your route appears immediately after creation
4. **Updates**: Route status updates in real-time

### General
1. **Stable Connection**: Works best with WiFi or 4G
2. **Battery**: Keep device charged for GPS usage
3. **Permissions**: Grant location access for best experience
4. **Refresh**: Use manual refresh if data seems stale

## Troubleshooting

### Map Not Loading
- Check internet connection
- Refresh the page
- Clear browser cache
- Try different browser

### GPS Not Working
- Enable location services in device settings
- Grant permission in browser
- Try outdoors for better signal
- Restart browser/device

### No Routes Showing
- Verify you're in a supported area
- Check if routes exist in your radius
- Try increasing search radius (future feature)
- Create a route to attract others

### Auto-Update Not Working
- Check if page is in foreground
- Verify internet connection
- Look for error messages
- Try manual refresh

## Privacy & Security

### Location Data
- **GPS Access**: Only used when Nearby View is open
- **Not Stored**: Location not saved on server
- **Local Only**: Position calculated on device
- **No Tracking**: No continuous tracking

### Route Data
- **Public Routes**: All active routes are visible
- **Driver Info**: Name, phone, vehicle visible to all
- **Passenger Info**: Only visible to booked driver
- **No History**: Past locations not stored

## Future Enhancements

### Planned Features
1. **WebSocket Updates**: Real-time position updates
2. **Advanced Filters**: Filter by time, price, seats
3. **Route Preview**: Show route path on hover
4. **Favorites**: Save favorite routes/drivers
5. **Notifications**: Alert for new nearby routes
6. **Offline Mode**: Cache routes for offline viewing
7. **Clustering**: Group nearby markers when zoomed out
8. **Heat Map**: Show demand density

### Under Consideration
- Driver ratings and reviews
- Estimated arrival times
- Route history
- Favorite locations
- Custom search radius
- Multi-stop routes
- Carpooling groups

## Technical Details

### API Endpoint
```
GET /api/routes/nearby?lat={lat}&lng={lng}&radius={radius}
```

### Update Frequency
- **Auto-Update**: Every 30 seconds
- **Manual**: On-demand via refresh button
- **On Location Change**: When user moves significantly

### Supported Browsers
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

### Requirements
- Modern browser with GPS support
- Internet connection
- Location services enabled
- JavaScript enabled

## Support

### Common Questions

**Q: Why can't I see any routes?**
A: There may be no active routes in your area. Try creating one or check back later.

**Q: How accurate is the location?**
A: GPS accuracy is typically 5-50 meters depending on conditions.

**Q: Does this work offline?**
A: No, an internet connection is required for real-time updates.

**Q: How often does it update?**
A: Automatically every 30 seconds, or manually via refresh button.

**Q: Can I change the search radius?**
A: Currently fixed at 20km. Custom radius is a planned feature.

### Getting Help
- Check this guide first
- Review error messages
- Try troubleshooting steps
- Contact support if issues persist

## Conclusion

The Nearby View feature provides a powerful, real-time way to discover available rides and connect with drivers in your area. With automatic updates, interactive maps, and detailed route information, finding or offering a ride has never been easier.

Happy riding! 🚗🗺️
