import React from "react";

import ControllerIconEmpty from "../../images/loginregister.png";
import ControllerIconFilled from "../../images/black-circle.png";
import "./ControllerButton.css";

const ControllerButton = (props) => {
  return (
    <div className="icon-container">
      {props.register ? (
        <button
          type="button"
          className={"button-controller-no-click"}
          onClick={props.onClick}
        >
          {/* need to attirbute the author for this icon */}
          <img
            src={ControllerIconFilled}
            className="icon-controller"
            alt="icon-filled"
          ></img>
        </button>
      ) : (
        <button
          type="button"
          className={"button-controller"}
          onClick={props.onClick}
        >
          {/* need to attirbute the author for this icon */}
          <img
            src={ControllerIconEmpty}
            className="icon-controller"
            alt="icon-empty"
          ></img>
        </button>
      )}
    </div>
  );
};

export default ControllerButton;
