class Controls {
  constructor(type) {
    this.fwd = false;
    this.left = false;
    this.right = false;
    this.rvs = false;

    switch (type){
      case "KEYS":
        this.#addKeyboardListeners();
        break;
    }
  }

  #addKeyboardListeners()
  {
    const up_keys = ["ArrowUp", "W", "w"];
    const down_keys = ["ArrowDown", "S", "s"];
    const left_keys = ["ArrowLeft", "A", "a"];
    const right_keys = ["ArrowRight", "D", "d"];

    //lambda func for keydown
    document.onkeydown=(event)=> {
      const key = event.key;
      if (up_keys.includes(key))
      {
        this.fwd = true;
      }
      else if (down_keys.includes(key))
      {
        this.rvs = true;
      }
      else if (left_keys.includes(key))
      {
        this.left = true;
      }
      else if (right_keys.includes(key))
      {
        this.right = true;
      }
    }
    //lambda function to reset
    document.onkeyup=(event)=>{
      const key = event.key;
      if (up_keys.includes(key))
      {
        this.fwd = false;
      }
      else if (down_keys.includes(key))
      {
        this.rvs = false;
      }
      else if (left_keys.includes(key))
      {
        this.left = false;
      }
      else if (right_keys.includes(key))
      {
        this.right = false;
      }
    }
  }
}
