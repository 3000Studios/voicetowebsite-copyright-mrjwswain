export function validate(schema) {
  return (request, response, next) => {
    const result = schema.safeParse(request.body)
    
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      
      return response.status(400).json({
        error: 'ValidationError',
        message: 'Invalid request data',
        details: errors
      })
    }
    
    request.validated = result.data
    next()
  }
}

export function validateQuery(schema) {
  return (request, response, next) => {
    const result = schema.safeParse(request.query)
    
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      
      return response.status(400).json({
        error: 'ValidationError',
        message: 'Invalid query parameters',
        details: errors
      })
    }
    
    request.validatedQuery = result.data
    next()
  }
}
