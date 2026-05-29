---
title: How to show weather on your personal website in 3 lines of JavaScript (no API key needed)
published: true
tags: webdev, javascript, opensource, api
---

I got tired of explaining to people why their "simple weather widget" needed an API key, a signup form, and a credit card.

So I built a weather API that doesn't need any of that.

Here's how you can add live weather to your personal website, portfolio, or side project in about 60 seconds.

## The old way (painful)

Most weather APIs make you:

- Create an account
- Verify your email
- Generate an API key
- Paste that key into your code
- Worry about rate limits
- Get an email when your "free tier" expires

For a weather widget on a personal site? That's overkill.

## The Nimbus way (one fetch, done)

I made a public API that doesn't need keys. Just call it.

```javascript
fetch('https://nimbus-api-gxuc.onrender.com/api/v1/weather?city=Berlin')
  .then(response => response.json())
  .then(data => {
    console.log(data);
  });
```

That's it. No headers. No tokens. No signup.

## Real example: Put it on your site

Here's a working snippet you can drop into any HTML page right now:

```html
<div id="weather-widget">
  <p>Loading weather...</p>
</div>

<script>
  fetch('https://nimbus-api-gxuc.onrender.com/api/v1/weather?city=Berlin')
    .then(res => res.json())
    .then(data => {
      const weatherHtml = data.temp_celsius + '°C • ' + data.description +
        '<br>Wind: ' + data.wind_speed_kmh + ' km/h • Humidity: ' + data.humidity_percent + '%';
      document.getElementById('weather-widget').innerHTML =
        '<strong>' + data.location + '</strong><br>' + weatherHtml;
    })
    .catch(function() {
      document.getElementById('weather-widget').innerHTML =
        '<p>Weather not available right now</p>';
    });
</script>
```

Change `Berlin` to any city. It works.

## Why did I build this?

Because I got tired of closed source APIs that change their pricing every 6 months.

Nimbus is open source. The code is on GitHub. You can read it, fork it, or run your own version if you don't trust me. The API is free because hosting a weather endpoint costs me almost nothing, and I'd rather lose money than put up a paywall.

## Try it right now

Open your terminal:

```bash
curl https://nimbus-api-gxuc.onrender.com/api/v1/weather?city=London
```

No API key. No signup. Just weather.

---

P.S. The geocoding API is coming soon. If you want to convert city names to coordinates without another API key, watch the repo.
