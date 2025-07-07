function initFormErrors() {
  $('[wr-type="error"]').hide()
  $('.error').removeClass('error')

  var formErrors = false

  const fieldError = function (field) {
    field.parent().find('[wr-type="error"]').show()
    field.addClass('error')
    formErrors = true
  }

  $('[wr-type="submit"]').click(function () {
    formErrors = false
    $('[wr-type="error"]').hide()
    $('.error').removeClass('error')

    let firstErrorFound = false

    $('[wr-type="required-field"]').each(function () {
      if (firstErrorFound) return false

      if ($(this).attr('type') === 'checkbox' && !$(this).is(':checked')) {
        fieldError($(this).siblings('.w-checkbox-input'))
        firstErrorFound = true
        return false
      }

      if ($(this).val().trim().length === 0) {
        fieldError($(this))
        firstErrorFound = true
        return false
      }

      if ($(this).attr('type') === 'email'
        && ($(this).val().indexOf('@') === -1 || $(this).val().indexOf('.') === -1)) {
        fieldError($(this))
        firstErrorFound = true
        return false
      }
    })

    if (!formErrors) {
      $(this).parents('form').submit()
    }
  })

  $('[wr-type="required-field"], [type="checkbox"]').on('input change blur', function () {
    $(this).removeClass('error')
    $(this).parent().find('[wr-type="error"]').hide()
    formErrors = false
  })

  $('input, textarea').keypress(function (e) {
    if (e.keyCode == 13) {
      e.preventDefault()
      $(this).trigger("change")
      $('[wr-type="submit"]').click()
    }
  })
}