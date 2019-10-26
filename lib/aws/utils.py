""" AWS-related utility routines. """


AWS_URL_TEMPLATE = "https://{account_id}.signin.aws.amazon.com/console?region={region}"


def get_aws_url(config):
    """ Returns the configured AWS url. """
    url = config.get("url", AWS_URL_TEMPLATE)
    return url.format(
        region=config.get("region", ""),
        account_id=config.get("account_id", "NO_ACCOUNT"))

