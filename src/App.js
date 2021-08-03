import React, { useState } from 'react'
import {
  useLoadScript,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";

function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_API_KEY,
    libraries: ['places'],
  });

  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";

  return <SearchBox />
}

function SearchBox() {
  const [place, setPlace] = useState({
    displayName: '',
    coordinate: '',
    postalCode: '',
    state: '',
    countryCode: '',
    address: {
      street: '',
      number: '',
      numberExtension: '',
      addition: '',
      postalCode: '',
      city: ''
    }
  })
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 800,
  });

  const handleInput = (e) => {
    setValue(e.target.value);
  };

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const result = results[0]

      const newPlace = {
        ...place,
        displayName: result.formatted_address,
        coordinate: await getLatLng(result),
      }

      const addressComponents = result.address_components;

      addressComponents.forEach((addressComponent) => {
        const longName = addressComponent.long_name || false;
        const shortName = addressComponent.short_name || false;
        const { types } = addressComponent;

        if (!types) return;

        if (!newPlace.address) return;

        if (types.includes('street_number') && longName) {
          newPlace.address.number = longName;
        }

        if (types.includes('route') && longName) {
          newPlace.address.street = longName;
        }

        if (types.includes('locality') && types.includes('political') && longName) {
          newPlace.address.city = longName;
        }

        if (types.includes('administrative_area_level_1') && types.includes('political') && longName) {
          newPlace.state = longName;
        }

        if (types.includes('country') && types.includes('political') && shortName) {
          newPlace.countryCode = shortName;
        }

        if (types.includes('postal_code') && longName) {
          newPlace.address.postalCode = longName;
          newPlace.postalCode = longName;
        }
      });

      console.log('result', result)
      console.log('place', newPlace)
      setPlace(newPlace)
    } catch (error) {
      console.log("😱 Error: ", error);
    }
  };

  return (
    <div>
      <h1>What is your current address?</h1>
      <Combobox onSelect={handleSelect}>
        <ComboboxInput
          value={value}
          onChange={handleInput}
          disabled={!ready}
          placeholder="Search your location"
          style={{ width: 500, padding: 10, fontSize: 20 }}
        />
        <ComboboxPopover>
          <ComboboxList style={{ padding: 10, border: 'none' }}>
            {status === "OK" &&
              data.map(({ id, description }) => (
                <ComboboxOption key={id} value={description} style={{ fontSize: 20, padding: 10 }} />
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
      <br />
      <input style={{ width: 400, padding: 10 }} value={place.address.number} />
      <br />
      <br />
      <input style={{ width: 400, padding: 10 }} value={place.address.city} />
      <br />
      <br />
      <input style={{ width: 400, padding: 10 }} value={place.state} />
      <br />
      <br />
      <input style={{ width: 400, padding: 10 }} value={place.postalCode} />
      <br />
      <br />
      <input style={{ width: 400, padding: 10 }} value={place.countryCode} />
    </div>
  )
}

export default App;
