
    (function ($) {
        showSwal = function (type, message) {
            'use strict';
            switch (type) {
                case 'success':
                    swal({
                        title: '',
                        text: message,
                        type: 'success',
                        button: {
                            text: "Затвори",
                            value: true,
                            visible: true,
                            className: "btn btn-success"
                        }
                    });
                    break;
                case 'error':
                    swal({
                        title: '',
                        text: message,
                        type: 'error',
                        button: {
                            text: "Затвори",
                            value: true,
                            visible: true,
                            className: "btn btn-danger"
                        }
                    });
                    break;
            }
        }

    })(jQuery);