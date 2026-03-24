const GEMINI_API_KEY = "AIzaSyDKklyzc54KzYx13ejxpURYrfYMVj0AGoY";

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`)
  .then(res => res.json())
  .then(data => {
      console.log("AUTHORIZED GOOGLE API MODELS:");
      if (data.models) {
          console.log(data.models.map(m => m.name));
      } else {
          console.log("No models returned. API Key might be invalid, or blocked via IP/Location.");
          console.log(data);
      }
  })
  .catch(err => console.error(err));
