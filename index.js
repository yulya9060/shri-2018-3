import inputData from "./input";

const isInHour = (i, el) => {
  if (el.mode) {
    if (el.mode === "day" && (i >= 7 && i < 21)) {
      return i + el.duration <= 21;
    }
    if (el.mode === "night") {
      if (i >= 21 && i <= 24) {
        return i + el.duration <= 24;
      }
      if (i >= 0 && i < 7) {
        return i + el.duration <= 7;
      }
    }
  } else {
    return i + el.duration <= 24;
  }
};

const rateInCurHourFunc = (i, rates) => {
  let value;
  rates.forEach(el => {
    if ((i >= el.from && i <= el.to) || i < 7 || i > 22) {
      value = el.value;
    }
  });
  return value;
};

const rateInDurationFunc = (i, el) => {
  let sum = 0;

  for (let l = i; l < el.duration + i; l++) {
    sum += (rateInCurHourFunc(l, inputData.rates) * el.power) / 1000;
  }

  return +sum.toFixed(2);
};

const isMinInStack = el => {
  let { stack } = el;
  let minEl = stack.find(el => el > 0);
  let minInd = stack.indexOf(minEl);
  let min = { index: minInd, value: minEl };

  for (let i = 0; i < stack.length; i++) {
    let v = stack[i];

    if (v !== 0) {
      min = v < min.value ? { index: i, value: v } : min;
    }
  }
  return min;
};

const isMaxPower = (el, i, currShedule, devices, maxPower) => {
  let sum = 0;

  if (currShedule.length !== 0) {
    for (let j = 0; j < currShedule.length; j++) {
      for (let i = 0; i < devices.length; i++) {
        if (currShedule[j] === devices[i].id) {
          sum += devices[i].power;
        }
      }
    }
    return sum + el.power <= maxPower;
  } else {
    return true;
  }
};

const deleteFromShedule = (el, shedule, consumed) => {
  for (let key in shedule) {
    shedule[key].map(item => {
      if (el.id === item) {
        shedule[key].pop();
      }
    });
  }
  delete consumed[el.id];
};

const appendInShedule = (el, shedule, maxPower, devices, consumedEnergy) => {
  let minStack = isMinInStack(el);
  let i = minStack.index;
  if (minStack.value !== undefined) {
    for (i; i < el.duration + minStack.index; i++) {
      if (isMaxPower(el, i, shedule[i], devices, maxPower)) {
        shedule[+i].push(el.id);
        consumedEnergy.devices[el.id] = minStack.value;
      } else {
        deleteFromShedule(el, shedule, consumedEnergy.devices);
        el.stack[minStack.index] = 0;
        appendInShedule(el, shedule, maxPower, devices, consumedEnergy);
      }
    }
  } else {
    console.log("shedule", { shedule, consumedEnergy });
    console.log("inputData", inputData);
    throw new Error(`нельзя добавить устройство ${el.name}`);
  }
};

const scheduling = (inputData, shedule, consumedEnergy) => {
  const { maxPower, devices, rates } = inputData;
  devices.forEach(el => {
    el.stack = [];
    el.stackCount = 0;
    for (let i = 0; i <= 23; i++) {
      if (isInHour(i, el)) {
        let rateInDuration;
        rateInDuration = rateInDurationFunc(i, el);
        el.stack.push(rateInDuration);
        el.stackCount += 1;
      } else {
        el.stack.push(0);
      }
    }
  });
  devices.sort((a, b) => a.stackCount - b.stackCount);

  devices.forEach(el => {
    appendInShedule(el, shedule, maxPower, devices, consumedEnergy);
  });

  for (let key in consumedEnergy.devices) {
    consumedEnergy.value += consumedEnergy.devices[key];
  }

  consumedEnergy.value = consumedEnergy.value.toFixed(3);

  console.log("shedule", { shedule, consumedEnergy });
  console.log("inputData", inputData);
  return { shedule, consumedEnergy };
};

try {
  let shedule = {};
  for (let i = 0; i <= 23; i++) {
    shedule[i] = [];
  }
  let consumedEnergy = { value: null, devices: {} };
  scheduling(inputData, shedule, consumedEnergy);
} catch (err) {
  console.log("Error", err.toString());
}
